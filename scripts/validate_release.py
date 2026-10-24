"""Independent release checks against exported assets and known geometric cases."""
import csv, gzip, hashlib, json, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'.deps'))
import shapely
from shapely.geometry import shape, box, Point
from shapely.ops import unary_union
from pyproj import Transformer
D=ROOT/'data'
def load(name): return json.loads((D/name).read_text(encoding='utf-8'))
manifest=load('manifest.json')
for name,meta in manifest['outputs'].items():
    assert hashlib.sha256((D/name).read_bytes()).hexdigest()==meta['sha256'],name
for p in D.glob('*.geojson.gz'):
    assert gzip.decompress(p.read_bytes())==p.with_suffix('').read_bytes()
app=load('app.json')
assert len(app['events'])==120
assert sum(e['longitude'] is not None for e in app['events'])==119
assert len(app['sites'])==92
assert sum(s['metrics'] is not None for s in app['sites'])==91
assert len(load('buildings.geojson')['features'])==2524
assert len(load('point_only.geojson')['features'])==1
assert len(app['areas'])==55
assert sum(a['market_episodes'] for a in app['areas'])==119
assert sum(a['commercial_buildings'] for a in app['areas'])+len(app['unassigned_commercial_buildings'])==2525
ids={e['event_id'] for e in app['events']}
assert len(ids)==120
assert all(a['event_id'] in ids for b in app['brands'] for a in b['appearances'])
assert all(len(set(b['site_ids']))==len(b['site_ids']) for b in app['brands'])
assert sum(len(b['site_ids'])>1 for b in app['brands'])==5
project=Transformer.from_crs(4326,3414,always_xy=True).transform
context=load('buildings.geojson')['features']+load('point_only.geojson')['features']
context_geoms=[shapely.transform(shape(f['geometry']),project,interleaved=False) for f in context]
for site in app['sites']:
    if site['longitude'] is None: continue
    pt=shapely.transform(Point(site['longitude'],site['latitude']),project,interleaved=False)
    expected={f['properties']['building_id'] for f,g in zip(context,context_geoms) if g.distance(pt)<=50}
    assert set(site['metrics']['nearby_50m_building_ids'])==expected,site['site_id']
previous=None
rounding_repairs={}
for w in (1,2,3):
    geometries=[]; invalid=0
    for f in load(f'oda_{w}m.geojson')['features']:
        g=shape(f['geometry'])
        if not g.is_valid: invalid+=1
        g=shapely.transform(shapely.make_valid(g),project,interleaved=False)
        assert g.area>=0
        assert f['properties']['scenario_width_m']==w
        assert f['properties']['status']=='modelled_unverified'
        geometries.append(g)
    rounding_repairs[str(w)]=invalid
    # Exported features themselves must be valid; catch precision-induced slivers.
    assert invalid==0,f'{w}m export contains {invalid} invalid features'
    area=unary_union(geometries).area
    expected=next(s['union_area_m2'] for s in app['scenarios'] if s['scenario_width_m']==w)
    assert abs(area-expected)/expected<.00005,(w,area,expected)
    if previous is not None: assert area>=previous
    previous=area

# Known fixture: 10x10 building, adjacent second obstacle, and a 2 m band.
b=box(0,0,10,10);obstacle=box(11,0,15,10)
z=b.buffer(2).difference(unary_union([b,obstacle]))
assert z.intersection(b).area==0 and z.intersection(obstacle).area==0
assert not z.covers(Point(12,5)) and z.covers(Point(-1,5))
assert Point(20,5).distance(b)==10
assert b.buffer(1).difference(b).difference(b.buffer(2).difference(b)).area<1e-9
assert abs(unary_union([z,z]).area-z.area)<1e-9
for s in app['sites']:
    if s['metrics'] is None: continue
    m=s['metrics']
    assert [m['radii'][str(r)]['building_count'] for r in (100,250,500)]==sorted(m['radii'][str(r)]['building_count'] for r in (100,250,500))
    for w in ('1','2','3'):
        a=[m['scenarios'][w]['radii'][str(r)]['union_area_m2'] for r in (100,250,500)]
        assert a==sorted(a)
review=list(csv.DictReader((D/'release_review.csv').open(encoding='utf-8')))
assert sum(x['record_type']=='event' for x in review)==120
assert sum(x['record_type']=='building' for x in review)==2525
assert not any((ROOT/p).exists() for p in ['data/sources.html','data/raw','data/contacts.csv'])
print(json.dumps({'passed':True,'verified_output_hashes':len(manifest['outputs']),
    'exported_geometries_valid':True,'rounding_repairs_needed':rounding_repairs,
    'checks':'geometry fixtures, compressed fidelity, CRS union-area agreement, counts, stable IDs, nested measures, release review'},indent=2))
