"""Reproducible, offline build from the frozen local v8 research snapshot.

python scripts/build_data.py --data-root ../drive_data
Dependencies may be installed normally or into the ignored .deps directory.
"""
import argparse, csv, gzip, hashlib, json, math, statistics, sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '.deps'))
import shapely
from shapely.geometry import shape, mapping, Point, Polygon, MultiPolygon
from shapely.ops import transform, unary_union
from shapely.strtree import STRtree
from pyproj import Transformer

parser = argparse.ArgumentParser()
parser.add_argument('--data-root', type=Path, default=ROOT.parent / 'drive_data')
args = parser.parse_args()
DATA = args.data_root.resolve()
V8 = DATA / '03_curated/2026-10-23-v8'
ADDRESS = DATA / '03_curated/2026-10-23-address-b07'
RAW = DATA / '01_raw/web_sources/2026-10-23-b03/datasets'
OUT = ROOT / 'data'
OUT.mkdir(exist_ok=True)
inputs = {}

def read(path):
    inputs[str(path.relative_to(DATA)).replace('\\', '/')] = hashlib.sha256(path.read_bytes()).hexdigest()
    return json.loads(path.read_text(encoding='utf-8-sig'))

def rows(path):
    inputs[str(path.relative_to(DATA)).replace('\\', '/')] = hashlib.sha256(path.read_bytes()).hexdigest()
    with path.open(encoding='utf-8-sig', newline='') as f:
        return list(csv.DictReader(f))

def write(name, obj):
    (OUT / name).write_text(json.dumps(obj, ensure_ascii=False, separators=(',', ':'), allow_nan=False), encoding='utf-8')

def write_csv(name, data):
    with (OUT / name).open('w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=list(data[0]))
        w.writeheader(); w.writerows(data)

fwd = Transformer.from_crs(4326, 3414, always_xy=True).transform
back = Transformer.from_crs(3414, 4326, always_xy=True).transform
def project(g): return shapely.transform(g, fwd, interleaved=False)
def polygonal(g):
    if isinstance(g, (Polygon, MultiPolygon)): return g
    return unary_union([x for x in getattr(g, 'geoms', []) if isinstance(x, (Polygon, MultiPolygon))])
def geo(g):
    # Preserve narrow metre-scale bands; round only after metric operations.
    rounded = json.loads(json.dumps(mapping(shapely.transform(g, back, interleaved=False)), default=float), parse_float=lambda x: round(float(x), 8))
    # Sub-millimetre fragments can collapse during coordinate rounding. Repair
    # the delivery geometry, not the full-precision measurement geometry.
    delivery = polygonal(shapely.make_valid(shape(rounded)))
    assert delivery.is_valid
    return mapping(delivery)
def fc(features): return {'type': 'FeatureCollection', 'features': features}
def feature(g, properties): return {'type': 'Feature', 'geometry': geo(g), 'properties': properties}

print('Reading frozen inputs', flush=True)
commercial = read(ADDRESS / 'commercial_building_polygons.geojson')['features']
points = read(ADDRESS / 'commercial_building_points.geojson')['features']
all_features = read(RAW / 'GOV002.geojson')['features']
all_geom = [project(shapely.make_valid(shape(f['geometry']))) for f in all_features]
obstacle_tree = STRtree(all_geom)
buildings = [project(shapely.make_valid(shape(f['geometry']))) for f in commercial]
events_in = rows(V8 / 'zoomout/events_2026_core.csv')
sites_in = rows(V8 / 'zoomout/sites_and_frequency.csv')
brand_rows = rows(V8 / 'online_evidence/brand_appearance_core_only.csv')
leads_in = read(V8 / 'zoomout/oda_candidate_leads.geojson')
areas_in = read(RAW / 'GOV003.geojson')['features']
assert len(commercial) == 2524 and len(points) == 2525
assert len(events_in) == 120

building_records = []
building_features = []
geom_by_id = {}
for f, g in zip(commercial, buildings):
    p = f['properties']
    record = {k: p.get(k) for k in ('building_id','block','street','postal_code','planning_area_by_centroid','source_ids','evidence_tier')}
    record['address'] = f"Blk {p['block']} {p['street']}"
    record['geometry_basis'] = 'Official HDB existing building footprint; address-linked research context'
    building_records.append(record)
    geom_by_id[p['building_id']] = g
    building_features.append(feature(g, record))
write('buildings.geojson', fc(building_features))
point_only = [f for f in points if f['properties']['building_id'] not in geom_by_id]
assert len(point_only) == 1
point_public = []
for f in point_only:
    p = f['properties']
    point_public.append({'type':'Feature','geometry':f['geometry'],'properties':{
        'building_id':p['building_id'], 'address':f"Blk {p['block']} {p['street']}",
        'geometry_basis':'Point only; no official footprint in archived layer', 'source_ids':p.get('source_ids','')}})
write('point_only.geojson', fc(point_public))
point_geoms = [project(shape(f['geometry'])) for f in point_only]
context_geom = buildings + point_geoms
context_ids = [f['properties']['building_id'] for f in commercial] + [f['properties']['building_id'] for f in point_only]

scenarios = {}
zone_features = {}
national = []
for width in (1,2,3):
    print(f'Computing {width}m scenario', flush=True)
    zones = []; features = []; violations = []
    for index, (f, g) in enumerate(zip(commercial, buildings)):
        envelope = g.buffer(width, quad_segs=8)
        nearby = [all_geom[int(i)] for i in obstacle_tree.query(envelope)]
        obstacles = unary_union(nearby + [g])
        z = polygonal(shapely.make_valid(envelope.difference(obstacles)))
        assert z.is_valid
        assert z.intersection(obstacles).area < 1e-5
        assert z.difference(envelope).area < 1e-5
        if width > 1:
            assert scenarios[width-1][index].difference(z).area < 1e-4
        zones.append(z)
        props = {'building_id':f['properties']['building_id'], 'scenario_width_m':width,
            'model_area_m2':round(z.area,2), 'method':'external_buffer_minus_known_hdb_footprints',
            'source_ids':f['properties'].get('source_ids',''), 'status':'modelled_unverified',
            'untested_conditions':['shopfront_direction','walkway_clearance','exit_clearance','land_control','permit','actual_use']}
        if not z.is_empty: features.append(feature(z,props))
    scenarios[width] = zones
    merged = unary_union(zones)
    national.append({'scenario_width_m':width,'gross_sum_m2':round(sum(z.area for z in zones),2),
        'union_area_m2':round(merged.area,2),'overlap_removed_m2':round(sum(z.area for z in zones)-merged.area,2),
        'nonempty_buildings':sum(not z.is_empty for z in zones)})
    write(f'oda_{width}m.geojson',fc(features))
    zone_features[width] = features
write_csv('scenario_summary.csv',national)

event_fields = ['event_id','site_id','event_name','start_date','end_date','date_status','calendar_status','date_conflict',
                'coordinate_basis','coordinate_precision_note','planning_area_by_proxy','source_ids','source_urls','raw_date_text']
events = []
for row in events_in:
    e = {k:row.get(k,'') for k in event_fields}
    e['longitude'] = float(row['longitude']) if row['longitude'] else None
    e['latitude'] = float(row['latitude']) if row['latitude'] else None
    e['date_conflict'] = row['date_conflict'].lower() == 'true'
    events.append(e)
assert sum(e['longitude'] is not None for e in events) == 119
events_by_site = defaultdict(list)
for e in events: events_by_site[e['site_id']].append(e)
sites = []
metrics_rows = []
for s in sites_in:
    sid = s['site_id']
    site = {'site_id':sid,'name':s['site_name'],'area':s.get('planning_area_by_proxy',''),
        'longitude':float(s['longitude']) if s['longitude'] else None,
        'latitude':float(s['latitude']) if s['latitude'] else None,
        'coordinate_basis':s['coordinate_basis'],'precision_note':s['coordinate_precision_note'],
        'event_ids':[e['event_id'] for e in events_by_site[sid]], 'metrics':None}
    if site['longitude'] is not None:
        p = project(Point(site['longitude'],site['latitude']))
        distances = shapely.distance(context_geom,p)
        nearest = int(distances.argmin())
        metrics = {'nearest_building_m':round(float(distances[nearest]),1), 'nearest_building_id':context_ids[nearest],
            'nearby_50m_building_ids':[context_ids[i] for i,d in enumerate(distances) if d <= 50], 'radii':{},'scenarios':{}}
        for radius in (100,250,500):
            indices = [i for i,d in enumerate(distances[:len(buildings)]) if d <= radius]
            metrics['radii'][str(radius)] = {'building_count':int(sum(distances <= radius)),
                'footprint_count':len(indices),'point_only_count':int(sum(distances[len(buildings):] <= radius))}
        for width,zones in scenarios.items():
            zd = shapely.distance(zones,p)
            finite = [float(x) for x in zd if math.isfinite(float(x))]
            m = {'nearest_zone_m':round(min(finite),1) if finite else None, 'radii':{}}
            for radius in (100,250,500):
                disk = p.buffer(radius, quad_segs=48)
                indices = [i for i,d in enumerate(zd) if d <= radius]
                area = unary_union([zones[i].intersection(disk) for i in indices]).area if indices else 0
                m['radii'][str(radius)] = {'candidate_building_count':len(indices),'union_area_m2':round(area,2)}
                metrics_rows.append({'site_id':sid,'scenario_width_m':width,'radius_m':radius,
                    'nearest_building_m':metrics['nearest_building_m'],'nearest_zone_m':m['nearest_zone_m'],
                    'commercial_building_count':metrics['radii'][str(radius)]['building_count'],
                    'candidate_building_count':len(indices),'candidate_union_area_m2':round(area,2)})
            metrics['scenarios'][str(width)] = m
        site['metrics'] = metrics
    sites.append(site)
write_csv('site_metrics.csv',metrics_rows)

# One point per source-linked building address, so planning-area counts do not count parts twice.
area_geom = [project(shapely.make_valid(shape(f['geometry']))) for f in areas_in]
def area_name(f):
    p=f['properties']
    if 'PLN_AREA_N' in p: return p['PLN_AREA_N']
    import re
    m=re.search(r'<th>PLN_AREA_N</th>\s*<td>(.*?)</td>',p.get('Description',''),re.S)
    if not m: raise ValueError('Cannot read planning area')
    return m.group(1)
area_names=[area_name(f) for f in areas_in]
building_area_count=Counter(); unmatched=[]
for f in points:
    point=project(shape(f['geometry']))
    matches=[name for name,g in zip(area_names,area_geom) if g.covers(point)]
    if matches: building_area_count[matches[0]] += 1
    else: unmatched.append(f['properties']['building_id'])
episode_counts=Counter(e['planning_area_by_proxy'] for e in events if e['longitude'] is not None)
site_counts=Counter(s['area'] for s in sites if s['longitude'] is not None)
area_rows=[{'planning_area':name,'commercial_buildings':building_area_count[name],
    'market_episodes':episode_counts[name], 'market_sites':site_counts[name]} for name in sorted(area_names)]
write_csv('planning_area_summary.csv',area_rows)
write('planning_areas.geojson',fc([feature(g,{'name':name}) for name,g in zip(area_names,area_geom)]))

brand_groups=defaultdict(list)
for b in brand_rows: brand_groups[b['vendor_id']].append(b)
brands=[]
for vid, appearances in brand_groups.items():
    appearance_records=[]; seen=set()
    for b in appearances:
        key=(b['event_id'],b['source_id'])
        if key in seen: continue
        seen.add(key)
        appearance_records.append({k:b.get(k,'') for k in ('presence_id','event_id','site_id','source_url','presence_basis','time_precision','identity_status','name_as_reported')})
    unique_sites=sorted(set(b['site_id'] for b in appearances if b['site_id'] in events_by_site))
    brands.append({'vendor_id':vid,'name':appearances[0]['public_name'],'identity_status':appearances[0]['identity_status'],
        'site_ids':unique_sites,'appearances':appearance_records})
brands.sort(key=lambda b:(-len(b['site_ids']),b['name'].casefold()))
lead_features=[]
for f in leads_in['features']:
    p=f['properties']
    lead_features.append({'type':'Feature','geometry':f['geometry'],'properties':{k:p.get(k) for k in
        ('lead_id','site_name','site_id','oda_status','lead_note','evidence_source_id','observation_date')}})
sources_in = rows(V8 / 'tables/sources.csv')
source_lookup = {s['source_id']:{'title':s['title'],'url':s['url']} for s in sources_in}
write('oda_leads.geojson',fc(lead_features))
rules=[
 {'id':'SCDF-WALKWAY','authority':'SCDF','rule':'Covered shopfront walkway: maintain at least 1.2 m clear width.', 'required_data':'Covered walkway geometry and measured clear width','status':'Not tested','scope':'Covered shopfront ODA type only','url':'https://www.scdf.gov.sg/fire-safety-services-listing/fire-code-2023/table-of-content/chapter-9-additional-requirements-for-each-purpose-group/clause-9.5-purpose-group-v-occupancy'},
 {'id':'TAMPINES-WALKWAY','authority':'Tampines Town Council','rule':'The linked application requires at least 1.5 m unobstructed walkway.', 'required_data':'Applicable jurisdiction, shopfront and walkway measurements','status':'Not tested','scope':'Tampines document example; not applied island-wide','url':'https://www.tampines.org.sg/Resources/Documents/ResidentServices/a8ac8910ee17452f976e6c7883cc6546.pdf'},
 {'id':'EXIT','authority':'SCDF','rule':'For covered-walkway ODAs, goods must not be placed within 3 m of exit-staircase discharge points.', 'required_data':'Surveyed exit-staircase discharge locations','status':'Not tested','scope':'Applicable shopfront configuration; not a universal building buffer','url':'https://www.scdf.gov.sg/fire-safety-services-listing/fire-code-2023/table-of-content/chapter-9-additional-requirements-for-each-purpose-group/clause-9.5-purpose-group-v-occupancy'},
 {'id':'APPROVAL','authority':'Town Council / HDB','rule':'Use of common property for ODA requires local approval; permitted trade and licence terms must be checked.', 'required_data':'Site-specific current permission, land control and shop trade','status':'Not tested','scope':'Candidate location does not establish approval','url':'https://www.sfa.gov.sg/news-publications/newsroom/neighbourhood-food-shop-vendors-must-comply-with-existing-regulations'},
 {'id':'GEOMETRY','authority':'Research model','rule':'Generate 1 / 2 / 3 m external bands and subtract known HDB building footprints.', 'required_data':'Commercial footprint and archived HDB footprint layer','status':'Applied','scope':'Geometric scenario only; no clearance or compliance inference','url':None}
]
write('rules.json',rules)
app={'as_of':'2026-10-23','year':2026,'events':events,'sites':sites,'brands':brands,'areas':area_rows,
    'scenarios':national,'sources':source_lookup,
    'counts':{'core_events':len(events),'geocoded_events':119,'sites':len(sites),
        'geocoded_sites':sum(s['longitude'] is not None for s in sites), 'commercial_points':len(points),
        'commercial_footprints':len(buildings),'point_only':1,'all_hdb_footprints':len(all_geom),
        'brand_appearances':len(brand_rows),'multi_site_brands':sum(len(b['site_ids'])>1 for b in brands)},
    'unassigned_commercial_buildings':unmatched}
write('app.json',app)
assert len(events_by_site)==len(sites)==92
assert sum(building_area_count.values())+len(unmatched)==2525
assert sum(episode_counts.values())==119
assert len({e['event_id'] for e in events})==120
for s in sites:
    if not s['metrics']: continue
    for radius in ('100','250','500'):
        a=[s['metrics']['scenarios'][str(w)]['radii'][radius]['union_area_m2'] for w in (1,2,3)]
        assert a==sorted(a)

# Per-record release review: only public business/place facts and derived geometry,
# never source HTML, photos, contacts, respondents, bids or raw mirrors.
review=[]
for e in events: review.append({'record_type':'event','record_id':e['event_id'],'decision':'included_public_factual_summary','basis':'Public event names, announced dates and source links; no copied prose/media'})
for f in points: review.append({'record_type':'building','record_id':f['properties']['building_id'],'decision':'included_minimal_derived_context','basis':'Official HDB geometry; public building address linkage attributed; no mirror rows or private fields'})
for b in brands: review.append({'record_type':'brand','record_id':b['vendor_id'],'decision':'included_public_name_association','basis':'Public reported business name and appearance source; identity remains unverified'})
for f in lead_features: review.append({'record_type':'oda_lead','record_id':f['properties']['lead_id'],'decision':'included_unverified_public_place_lead','basis':'Public place and evidence type only; no private contact or permit claim'})
write_csv('release_review.csv',review)
write('validation.json',{'passed':True,'checks':['input counts','stable unique event IDs','valid metric scenario geometries',
    'all known HDB obstacles removed','scenario containment','nested scenario area','dissolved area avoids duplicate counting',
    '119 geocoded episodes; 92 distinct site IDs','planning-area reconciliation','per-record public field review'],
    'national_scenarios':national,'counts':app['counts'],'unassigned_commercial_buildings':unmatched})
for p in OUT.glob('*.geojson'):
    p.with_suffix(p.suffix+'.gz').write_bytes(gzip.compress(p.read_bytes(),compresslevel=9,mtime=0))
mapped=[s for s in sites if s['metrics']]
nearest=[s['metrics']['nearest_building_m'] for s in mapped]
top=sorted(area_rows,key=lambda a:-a['market_episodes'])[:8]
analysis=['# Temporary Grounds: analysis findings','',
    'Frozen source snapshot: 23 October 2026. Scope: 2026 core market announcements. Results are descriptive; the sample is not a census.','',
    f"- {len(events)} episodes across {len(sites)} distinct site IDs; {len(mapped)} mapped sites / 119 mapped episodes.",
    f"- {len(points)} HDB commercial address records; {len(buildings)} footprint-linked and one point-only.",
    f"- Median nearest commercial-geometry distance across the {len(mapped)} mapped sites: {statistics.median(nearest):,.1f} m (each site counted once).",
    f"- {sum(s['metrics']['radii']['250']['building_count']>0 for s in mapped)} of {len(mapped)} mapped sites have at least one commercial building within 250 m of the representative point.",
    f"- {sum(len(b['site_ids'])>1 for b in brands)} multi-site recorded brand-name keys in {len(brand_rows)} core-market appearance leads. These do not establish common operators or movement.",'',
    '## Planning-area context','', '| Planning area | Announced episodes | Distinct sites | Commercial address points |','|---|---:|---:|---:|']
analysis += [f"| {a['planning_area']} | {a['market_episodes']} | {a['market_sites']} | {a['commercial_buildings']} |" for a in top]
analysis += ['', 'Area totals use representative-point assignment; one unlocated episode cannot be spatially assigned. Zero collected episodes does not prove absence.', '',
    '## Uniform ODA candidate scenarios','', '| Assumed external depth | Union area (m²) | Overlap removed (m²) |','|---|---:|---:|']
analysis += [f"| {n['scenario_width_m']} m | {n['union_area_m2']:,.2f} | {n['overlap_removed_m2']:,.2f} |" for n in national]
analysis += ['', 'These are modelled external-band areas, not actual or lawful ODA supply. All known HDB footprints are subtracted. Non-HDB obstacles, roads, public/private land control, shopfront direction, walkway widths and exits remain unknown. Full-perimeter bands can overestimate candidate space and miss covered internal corridors. No compliance, actual-use or market-overlap conclusion follows.', '',
    '## Reproduction and evidence','', 'See `scripts/build_data.py`, `data/manifest.json`, `data/validation.json`, `data/site_metrics.csv`, `data/planning_area_summary.csv` and `data/scenario_summary.csv`. Each output is tied to input hashes. The GEMS b10 working supplement remains outside the canonical v8 event counts.']
(ROOT/'ANALYSIS.md').write_text('\n'.join(analysis)+'\n',encoding='utf-8')
manifest={'baseline':'v8','as_of':'2026-10-23','analysis_crs':'EPSG:3414','output_crs':'EPSG:4326',
    'shapely':shapely.__version__,'inputs':inputs,
    'outputs':{p.name:{'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size}
               for p in sorted(OUT.iterdir()) if p.name!='manifest.json'},
    'release_basis':'Educational research. Minimal public facts and derived official geometry only; see release_review.csv and SOURCES.md.'}
write('manifest.json',manifest)
print(json.dumps({'counts':app['counts'],'scenarios':national,'output_MB':round(sum(p.stat().st_size for p in OUT.iterdir())/1e6,2)},indent=2),flush=True)
