"""Publish this reviewed static directory using existing Git Credential Manager auth.

Credentials stay in process memory and are never written or printed.
--check is read-only. --publish creates the requested public repo if absent,
pushes main, enables Pages and records non-secret publication state.
--status only reads the repository/Pages state.
"""
import argparse, json, os, re, subprocess, sys, urllib.request, urllib.error
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OWNER='zh-sssss'; REPO='pasar-malam-singapore'
p=argparse.ArgumentParser();p.add_argument('action',choices=['--check','--publish','--status','check','publish','status']);a=p.parse_args()
env={**os.environ,'GCM_INTERACTIVE':'Never','GIT_TERMINAL_PROMPT':'0'}
cred=subprocess.run(['git','credential','fill'],input='protocol=https\nhost=github.com\n\n',text=True,capture_output=True,env=env)
if cred.returncode:
    print('GitHub credential unavailable in Git Credential Manager; no credentials printed.');sys.exit(2)
fields=dict(line.split('=',1) for line in cred.stdout.splitlines() if '=' in line)
token=fields.get('password')
if not token: print('No stored GitHub password/token.');sys.exit(2)
def api(path,method='GET',body=None):
    req=urllib.request.Request('https://api.github.com'+path,
        data=json.dumps(body).encode() if body is not None else None,method=method,
        headers={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'Temporary-Grounds-DEP5118','Content-Type':'application/json'})
    try:
        with urllib.request.urlopen(req,timeout=30) as r:return r.status,json.load(r) if r.status!=204 else {}
    except urllib.error.HTTPError as e:
        try: body=json.load(e)
        except Exception:body={}
        return e.code,{'message':body.get('message','HTTP error')}
def git(*args):
    r=subprocess.run(['git','-c','safe.directory='+ROOT.as_posix(),*args],cwd=ROOT,text=True,capture_output=True,env=env)
    if r.returncode: raise RuntimeError('Git operation failed: '+args[0]+'; '+r.stderr.replace(token,'[redacted]'))
    return r.stdout.strip()
status,user=api('/user')
if status!=200:print(json.dumps({'auth_status':status,'message':user.get('message')}));sys.exit(2)
if user['login'].lower()!=OWNER:print('Authenticated account differs from requested owner; no mutation performed.');sys.exit(2)
status,repo=api(f'/repos/{OWNER}/{REPO}')
print(json.dumps({'authenticated_account':user['login'],'repository_status':status,'repository':repo.get('html_url')}),flush=True)
action=a.action.lstrip('-')
if action=='check':sys.exit(0)
if action=='publish':
    if status==404:
        status,repo=api('/user/repos','POST',{'name':REPO,'description':'Temporary Grounds — Singapore pasar malam, HDB commercial buildings and modelled ODA candidate spaces. DEP5118 research.','private':False,'auto_init':False})
        if status!=201:print(json.dumps({'create_status':status,'message':repo.get('message')}));sys.exit(2)
    elif status!=200:print('Cannot resolve repository safely.');sys.exit(2)
    elif repo.get('size',0)>0 and not (ROOT/'.git').exists():print('Existing nonempty repository; no overwrite attempted.');sys.exit(2)
    if not (ROOT/'.git').exists():
        git('init','-b','main');git('config','user.name','Zhiheng Shu');git('config','user.email','273487696+zh-sssss@users.noreply.github.com')
        git('remote','add','origin',f'https://github.com/{OWNER}/{REPO}.git')
    # Browser public token is intentionally not committed. Deploy-time injection
    # preserves repository push protection while keeping the static map functional.
    config=(ROOT/'mapbox-config.js').read_text(encoding='utf-8')
    match=re.search(r'accessToken:\s*("[^"\n]+")',config)
    if not match:raise RuntimeError('Local public Mapbox configuration unavailable')
    public_map_token=json.loads(match.group(1))
    if not public_map_token.startswith('pk.'):raise RuntimeError('Only public Mapbox tokens may be deployed')
    variable={'name':'MAPBOX_PUBLIC_TOKEN','value':public_map_token}
    vs,vbody=api(f'/repos/{OWNER}/{REPO}/actions/variables/MAPBOX_PUBLIC_TOKEN','PATCH',variable)
    if vs==404:vs,vbody=api(f'/repos/{OWNER}/{REPO}/actions/variables','POST',variable)
    if vs not in (201,204):raise RuntimeError('Could not configure deployment variable: '+str(vs))
    ps,pages=api(f'/repos/{OWNER}/{REPO}/pages')
    if ps==404:ps,pages=api(f'/repos/{OWNER}/{REPO}/pages','POST',{'build_type':'workflow'})
    elif ps==200 and pages.get('build_type')!='workflow':ps,pages=api(f'/repos/{OWNER}/{REPO}/pages','PUT',{'build_type':'workflow'})
    if ps not in (200,201,204):raise RuntimeError('Could not select Pages workflow deployment: '+str(ps))
    git('add','.')
    if git('diff','--cached','--name-only'):
        git('commit','-m','Build Temporary Grounds nationwide pasar malam analysis website')
    git('push','-u','origin','main')
    ps,pages=api(f'/repos/{OWNER}/{REPO}/pages')
    result={'repository':f'https://github.com/{OWNER}/{REPO}','commit':git('rev-parse','HEAD'),'pages_http_status':ps,'pages_url':pages.get('html_url'),'pages_status':pages.get('status'),'message':pages.get('message')}
    (ROOT/'.publish_state.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result),flush=True)
else:
    ps,pages=api(f'/repos/{OWNER}/{REPO}/pages')
    bs,build=api(f'/repos/{OWNER}/{REPO}/pages/builds/latest')
    print(json.dumps({'pages_status_code':ps,'pages_url':pages.get('html_url'),'pages_status':pages.get('status'),'build_status':build.get('status'),'build_commit':build.get('commit'),'build_error':build.get('error')}),flush=True)
