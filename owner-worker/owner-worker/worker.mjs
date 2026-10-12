const TEAM='https://black-dawn-3436.cloudflareaccess.com';
const AUD='c87a7d98c9cef2c82b9487d59accd0331741840529f8bedb607be470b8394a1a';
const OWNER='yjjn2005@gmail.com';
let keyCache=null,keyAt=0;
const bytes=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
async function verifyOwner(request){
 const token=request.headers.get('Cf-Access-Jwt-Assertion');if(!token||token.length>16000)throw Error('auth');
 const parts=token.split('.');if(parts.length!==3)throw Error('auth');
 const head=JSON.parse(new TextDecoder().decode(bytes(parts[0]))),payload=JSON.parse(new TextDecoder().decode(bytes(parts[1])));
 const now=Math.floor(Date.now()/1000);
 if(head.alg!=='RS256'||payload.iss!==TEAM||!Array.isArray(payload.aud)||!payload.aud.includes(AUD)||payload.email!==OWNER||!Number.isFinite(payload.exp)||payload.exp<=now||(payload.nbf&&payload.nbf>now+30))throw Error('auth');
 if(!keyCache||Date.now()-keyAt>3600000){const r=await fetch(TEAM+'/cdn-cgi/access/certs');if(!r.ok)throw Error('auth');keyCache=(await r.json()).keys;keyAt=Date.now();}
 let jwk=keyCache.find(k=>k.kid===head.kid&&k.alg==='RS256');if(!jwk){keyCache=null;throw Error('auth');}
 const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
 if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,bytes(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1])))throw Error('auth');return payload;
}
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','X-Frame-Options':'DENY'};
const json=(data,status=200)=>Response.json(data,{status,headers});
function validData(d){
 if(!d||typeof d!=='object'||!d.params||typeof d.params!=='object'||Array.isArray(d.params))return false;
 if(!['base','optimistic','pessimistic'].includes(d.scenario)||!['p15','p18'].includes(d.currentPlan||d.plan))return false;
 if(!Array.isArray(d.manual)||!Array.isArray(d.memos)||!d.acctHoldings||typeof d.acctHoldings!=='object')return false;
 for(const [k,v] of Object.entries(d.params)){if(k==='shareholders'){if(!v||Object.values(v).some(x=>typeof x!=='number'||!Number.isFinite(x)||x<0||x>1)||Object.values(v).reduce((a,b)=>a+b,0)>1.000001)return false;}else if(typeof v!=='number'||!Number.isFinite(v)||(/Growth|Change/.test(k)?v<=-1:v<0)||(k==='usTax'&&v>1))return false;}
 for(const h of Object.values(d.acctHoldings)){if(!h||typeof h!=='object')return false;for(const k of ['qty','avg','manual','costKrw'])if(h[k]!==undefined&&(typeof h[k]!=='number'||!Number.isFinite(h[k])||h[k]<0))return false;}
 return true;
}
async function initDB(db){await db.prepare('CREATE TABLE IF NOT EXISTS owner_state (id TEXT PRIMARY KEY, revision INTEGER NOT NULL, data TEXT NOT NULL, updated_at TEXT NOT NULL)').run();await db.prepare('CREATE TABLE IF NOT EXISTS state_history (id INTEGER PRIMARY KEY AUTOINCREMENT, revision INTEGER, data TEXT, updated_at TEXT)').run();}
async function serveApp(){const r=await fetch('https://yjjn2005.github.io/corp-etf-sim/owner-app.html',{cf:{cacheTtl:0}});const text=await r.text();const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))).map(x=>x.toString(16).padStart(2,'0')).join('');if(!r.ok||digest!='dbce403384be2f8f6f57b0be0e3373e34c3734952019317aba01a2f5749f0eb1')return json({error:'App source validation failed'},503);return new Response(text,{headers:{...headers,'Content-Type':'text/html; charset=utf-8'}});}
export default {async fetch(request,env){
 try{await verifyOwner(request);}catch{return json({error:'Owner login required'},403);}
 const url=new URL(request.url);
 if(request.method==='GET'&&url.pathname==='/')return await serveApp();
 if(request.method==='GET'&&url.pathname==='/prices.json'){const r=await fetch('https://yjjn2005.github.io/corp-etf-sim/prices.json',{cf:{cacheTtl:0}});return new Response(await r.text(),{status:r.status,headers:{...headers,'Content-Type':'application/json'}});}
 if(request.method==='GET'&&url.pathname==='/api/account-snapshot'){if(!env.DB)return json({error:'Storage unavailable'},503);try{const r=await env.DB.prepare('SELECT data FROM account_snapshot WHERE id=?').bind(OWNER).first();return r?json(JSON.parse(r.data)):json({error:'Account snapshot not found'},404);}catch{return json({error:'Account snapshot unavailable'},503);}}
if(url.pathname!=='/api/state')return json({error:'Not found'},404);
 if(!env.DB)return json({error:'Storage unavailable'},503);
 try{
 await initDB(env.DB);
 if(request.method==='GET'){const r=await env.DB.prepare('SELECT revision,data,updated_at FROM owner_state WHERE id=?').bind(OWNER).first();return json(r?{revision:r.revision,data:JSON.parse(r.data),updatedAt:r.updated_at}:{revision:0,data:null,updatedAt:null});}
 if(request.method!=='PUT')return json({error:'Method not allowed'},405);
 if(request.headers.get('Origin')!==url.origin||request.headers.get('X-Sync-Request')!=='1'||!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'Same origin required'},403);
 const text=await request.text();if(new TextEncoder().encode(text).length>1000000)return json({error:'Too large'},413);
 let body;try{body=JSON.parse(text)}catch{return json({error:'Invalid JSON'},400);}
 if(!Number.isSafeInteger(body.revision)||body.revision<0||!validData(body.data))return json({error:'Invalid state'},400);
 const next=body.revision+1,when=new Date().toISOString(),data=JSON.stringify(body.data);
 // Conditional UPSERT is atomic. A stale device cannot silently overwrite newer data.
 const results=await env.DB.batch([
 env.DB.prepare('INSERT INTO state_history(revision,data,updated_at) SELECT revision,data,updated_at FROM owner_state WHERE id=? AND revision=?').bind(OWNER,body.revision),
 env.DB.prepare('INSERT INTO owner_state(id,revision,data,updated_at) SELECT ?,?,?,? WHERE ?=0 OR EXISTS(SELECT 1 FROM owner_state WHERE id=? AND revision=?) ON CONFLICT(id) DO UPDATE SET revision=excluded.revision,data=excluded.data,updated_at=excluded.updated_at WHERE owner_state.revision=?').bind(OWNER,next,data,when,body.revision,OWNER,body.revision,body.revision)
 ]);
 if(results[1].meta.changes!==1)return json({error:'Conflict'},409);
 return json({revision:next,updatedAt:when});
 }catch{return json({error:'Storage error; local data preserved'},503);}
}};
