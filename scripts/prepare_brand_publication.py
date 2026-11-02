"""Preserve the live original website and add the reviewed brand chapter.

Only public website resources are copied. Brand display points are supplied
through an Actions variable (or an ignored local runtime), never Git history.
No research exports, reports, audits or local token configuration are read.
"""
import argparse
import base64
from concurrent.futures import ThreadPoolExecutor
import gzip
import hashlib
import json
import os
import re
from pathlib import Path
import shutil
import urllib.request
from prepare_feedback_context import context_for
from prepare_ushahidi_connection import prepare as prepare_ushahidi

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://zh-sssss.github.io/pasar-malam-singapore/'
FILES = ['index.html', 'app.js', 'style.css', 'mapbox-config.js',
         'data/app.json', 'data/rules.json']
for name in ['buildings', 'point_only', 'planning_areas', 'oda_2m']:
    FILES.extend([f'data/{name}.geojson', f'data/{name}.geojson.gz'])
FIELDS = ['point_id','vendor_id','brand_name','point_type','location_name',
          'address','longitude','latitude','coordinate_precision',
          'coordinate_source_url','google_maps_url','operating_status',
          'source_group','classification_inferred','event_start','event_end',
          'source_url']

def build(local_runtime=None):
    out = ROOT / '__brand_publish'
    if out.exists():
        if out.is_symlink() or out.resolve() != ROOT / '__brand_publish':
            raise ValueError('Unexpected publication output path')
        shutil.rmtree(out)
    out.mkdir()

    def preserve(name):
        request = urllib.request.Request(BASE + name, headers={'User-Agent':'BrandAtlas-Publication'})
        with urllib.request.urlopen(request, timeout=90) as response:
            content = response.read()
        destination = out / name
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(content)
        return name

    with ThreadPoolExecutor(max_workers=5) as pool:
        preserved = list(pool.map(preserve, FILES))
    (out / '.nojekyll').touch()
    if local_runtime:
        points = json.loads(Path(local_runtime).read_text(encoding='utf-8'))['points']
    else:
        packed = os.environ.get('BRAND_DISPLAY_POINTS_GZIP', '')
        if not packed:
            raise ValueError('Reviewed display points are missing; original website was not deployed')
        points = json.loads(gzip.decompress(base64.b64decode(packed, validate=True)))
    points = [{key:point.get(key) for key in FIELDS} for point in points]
    assert len(points) == 150 and len({p['point_id'] for p in points}) == 150
    assert all(p['point_type'] in ['permanent','temporary'] and p['source_url'] for p in points)
    assert sum(p['point_type']=='permanent' for p in points) == 59
    land = json.loads((out/'data/planning_areas.geojson').read_text(encoding='utf-8'))
    chapter = out / 'brand-connections'
    chapter.mkdir()
    for name in ['index.html','app.js','style.css','scene.js','model.js','logos.js','community.js','feedback-connection.js','ushahidi.js']:
        shutil.copy2(ROOT/'brand-connections'/name, chapter/name)
    (chapter/'feedback').mkdir()
    for name in ['index.html','app.js','map.js','api.js','model.js','feedback.css']:
        shutil.copy2(ROOT/'brand-connections/feedback'/name,chapter/'feedback'/name)
    api_base=os.environ.get('FEEDBACK_API_BASE','')
    public_url=os.environ.get('USHAHIDI_PUBLIC_URL','')
    if any(value and not value.startswith('https://') for value in [api_base,public_url]):
        raise ValueError('Feedback connection URLs must use HTTPS')
    (chapter/'feedback-connection.js').write_text('export const FEEDBACK_CONNECTION='+json.dumps({'apiBase':api_base,'deploymentUrl':public_url})+';\n',encoding='utf-8')
    # Version module URLs as well as the entrypoint, so published edits do not
    # reuse an older scene from a visitor's browser cache.
    def version_imports(path):
        def replace(match):
            relative=match.group(1)
            if not relative.startswith('.'):return match.group(0)
            target=(path.parent/relative).resolve()
            if not target.is_relative_to(chapter.resolve()):raise ValueError('Unexpected module path')
            version=hashlib.sha256(target.read_bytes()).hexdigest()[:12]
            return "from '"+relative+'?v='+version+"'"
        return re.sub(r"from '([^']+\.js)'",replace,path.read_text(encoding='utf-8'))
    for name in ['scene.js','community.js','feedback/map.js','feedback/api.js','feedback/app.js','app.js']:
        path=chapter/name
        path.write_text(version_imports(path),encoding='utf-8')
    for directory,css in [(chapter,'style.css'),(chapter/'feedback','feedback.css')]:
        path=directory/'index.html'
        html=version_imports(path)
        version=hashlib.sha256((directory/css).read_bytes()).hexdigest()[:12]
        path.write_text(html.replace('./'+css,'./'+css+'?v='+version),encoding='utf-8')
    (chapter/'data').mkdir()
    if not api_base:
        prepare_ushahidi(chapter/'data')
    (chapter/'data/runtime.json').write_text(json.dumps(
        {'as_of':'2026-10-28','points':points,'land':land},
        ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    market_app=json.loads((out/'data/app.json').read_text(encoding='utf-8'))
    (chapter/'data/feedback-context.json').write_text(json.dumps(context_for(market_app,land),ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    assert not list(out.rglob('*.csv')) and not list(out.rglob('*.xlsx'))
    assert not list(out.rglob('*.md')) and not list(out.rglob('*.pdf'))
    print(f'Preserved {len(preserved)} public resources; prepared {len(points)} reviewed display points.')

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--local-runtime',type=Path)
    build(parser.parse_args().local_runtime)
