"""Preserve the live original website and add the reviewed brand chapter.

Only public website resources are copied. Brand display points are supplied
through an Actions variable (or an ignored local runtime), never Git history.
No research exports, reports, audits or local token configuration are read.
"""
import argparse
import base64
from concurrent.futures import ThreadPoolExecutor
import gzip
import json
import os
from pathlib import Path
import shutil
import urllib.request

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
    for name in ['index.html','app.js','style.css','scene.js','model.js','logos.js']:
        shutil.copy2(ROOT/'brand-connections'/name, chapter/name)
    (chapter/'data').mkdir()
    (chapter/'data/runtime.json').write_text(json.dumps(
        {'as_of':'2026-10-28','points':points,'land':land},
        ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    assert not list(out.rglob('*.csv')) and not list(out.rglob('*.xlsx'))
    assert not list(out.rglob('*.md')) and not list(out.rglob('*.pdf'))
    print(f'Preserved {len(preserved)} public resources; prepared {len(points)} reviewed display points.')

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--local-runtime',type=Path)
    build(parser.parse_args().local_runtime)
