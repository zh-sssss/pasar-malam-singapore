"""Build the static deployment directory; inject only a public Mapbox token."""
import gzip,hashlib,json,os,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'__site'
token=os.environ.get('MAPBOX_PUBLIC_TOKEN','')
if not token.startswith('pk.'):
    raise SystemExit('MAPBOX_PUBLIC_TOKEN must contain a public pk. browser token')
if OUT.exists():
    # Only clear the exact generated artifact directory, never research/source data.
    target=OUT.resolve()
    if OUT.is_symlink() or target!=ROOT/'__site' or target.parent!=ROOT:
        raise SystemExit('Refusing to clean an unexpected deployment path')
    shutil.rmtree(target)
OUT.mkdir()
for name in ['index.html','app.js','style.css','.nojekyll']:
    shutil.copy2(ROOT/name,OUT/name)
(OUT/'data').mkdir()
# Publish a map-runtime allowlist. Analysis exports and audit reports stay in Git/local storage.
for name in ['buildings.geojson','point_only.geojson','planning_areas.geojson','oda_2m.geojson','rules.json']:
    shutil.copy2(ROOT/'data'/name,OUT/'data'/name)
    if name.endswith('.geojson'):shutil.copy2(ROOT/'data'/(name+'.gz'),OUT/'data'/(name+'.gz'))
public_app=json.loads((ROOT/'data/app.json').read_text(encoding='utf-8'))
public_app.pop('scenarios',None);public_app.pop('sources',None);public_app.pop('unassigned_commercial_buildings',None)
public_app['areas']=[{'planning_area':a['planning_area']} for a in public_app['areas']]
for site in public_app['sites']:
    if site['metrics'] is not None:site['metrics']={'nearby_50m_building_ids':site['metrics']['nearby_50m_building_ids']}
(OUT/'data/app.json').write_text(json.dumps(public_app,ensure_ascii=False,separators=(',',':')),encoding='utf-8',newline='\n')
(OUT/'mapbox-config.js').write_text('window.MAPBOX_CONFIG = '+json.dumps({'accessToken':token,'style':'mapbox://styles/mapbox/standard'})+';\n',encoding='utf-8',newline='\n')
html=(OUT/'index.html').read_text(encoding='utf-8')
for asset in ('app.js','style.css','mapbox-config.js'):
    version=hashlib.sha256((OUT/asset).read_bytes()).hexdigest()[:12]
    html=html.replace('"'+asset+'"','"'+asset+'?v='+version+'"')
(OUT/'index.html').write_text(html,encoding='utf-8',newline='\n')
assert not list(OUT.rglob('*.csv')) and not list(OUT.rglob('*.md'))
assert not (OUT/'data/manifest.json').exists() and not (OUT/'data/validation.json').exists()
print('Prepared static site with deployment-injected public Mapbox configuration.')
