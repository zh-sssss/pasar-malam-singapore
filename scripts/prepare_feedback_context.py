"""Create a local-only display context from the existing research snapshot."""
import argparse,json
from pathlib import Path

def context_for(app,areas):
    sites=[{key:site.get(key) for key in ['site_id','name','area','longitude','latitude','coordinate_basis','precision_note']} for site in app['sites']]
    events=[{key:event.get(key) for key in ['event_id','site_id','start_date','end_date','date_conflict','source_urls']} for event in app['events']]
    return {'version':1,'as_of':app['as_of'],'sites':sites,'events':events,'areas':areas}

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--markets',required=True,type=Path)
    parser.add_argument('--areas',required=True,type=Path)
    parser.add_argument('--output',type=Path,default=Path(__file__).resolve().parents[1]/'site/brand-connections/data/feedback-context.json')
    args=parser.parse_args()
    context=context_for(json.loads(args.markets.read_text(encoding='utf-8')),json.loads(args.areas.read_text(encoding='utf-8')))
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(context,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    print(f"Prepared {len(context['sites'])} market sites and {len(context['areas']['features'])} planning areas. Original inputs remain unchanged.")
