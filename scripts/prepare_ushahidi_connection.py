"""Build public guest-client runtime files; never reads administrator credentials."""
import argparse
import json
from pathlib import Path
import urllib.request

DEPLOYMENT = 'https://singapore-night-market-atlas.ushahidi.io'
API = 'https://singapore-night-market-atlas.api.ushahidi.io'
CLIENT = 'https://raw.githubusercontent.com/ushahidi/platform-client-mzima/development/apps/web-mzima-client/src/env.json'

def get(url):
    with urllib.request.urlopen(url, timeout=30) as response:
        return json.load(response)

def prepare(destination):
    forms = get(API+'/api/v3/forms')['results']
    brand = next(f for f in forms if f['name']=='Brand and location contributions')
    preference = next(f for f in forms if f['name']=='Vendor location preferences')
    for form in [brand, preference]:
        if not form['require_approval'] or not form['hide_author']:
            raise ValueError('Live moderation and author-hiding must be enabled')
    labels = {'payload':'Atlas payload','point':'Location','brand_name':'Brand name',
              'vendor_id':'Canonical brand ID','point_type':'Location type',
              'category':'Shop category','photo':'Shop photo'}
    attrs = get(API+f"/api/v3/forms/{brand['id']}/attributes")['results']
    fields = {key:next(a['key'] for a in attrs if a['label']==label) for key,label in labels.items()}
    attrs = get(API+f"/api/v3/forms/{preference['id']}/attributes")['results']
    fields['preference_payload'] = next(a['key'] for a in attrs if a['label']=='Atlas preference payload')
    connection = dict(transport='ushahidi-guest',apiBase=API,deploymentUrl=DEPLOYMENT,
                      brandFormId=brand['id'],preferenceFormId=preference['id'],fields=fields)
    client = get(CLIENT)
    destination = Path(destination)
    destination.mkdir(parents=True, exist_ok=True)
    (destination/'feedback-service.json').write_text(json.dumps(connection),encoding='utf-8')
    # This is Ushahidi's published anonymous client, not an owner/admin secret.
    (destination/'ushahidi-client.json').write_text(json.dumps({
        'client_id':client['oauth_client_id'],'client_secret':client['oauth_client_secret']}),encoding='utf-8')
    return connection

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--output',type=Path,default=Path(__file__).resolve().parents[1]/'site/brand-connections/data')
    prepare(parser.parse_args().output)
    print('Prepared public guest runtime; no administrator credentials used.')
