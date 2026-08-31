// ══════════════════════════════════════════════════════════
// corp-etf-sync — Cloudflare Workers KV 동기화 서버
//
// 배포 방법 (Cloudflare 대시보드):
// 1. Workers & Pages → Create → "Start with Hello World!" → 이름: corp-etf-sync → Deploy
// 2. 좌측 메뉴 Storage & Databases → KV → Create namespace → 이름: CORP_ETF_DATA
// 3. corp-etf-sync 워커 → Settings → Bindings → Add → KV Namespace
//    - Variable name: DATA
//    - KV namespace: CORP_ETF_DATA
// 4. 워커 → Edit code → 이 파일 전체를 붙여넣기 → Deploy
// ══════════════════════════════════════════════════════════

const SECRET = 'Kp9mXv2rLqW8nHdT';
const KEY = 'corp-etf-sim-v8';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Secret, Cache-Control',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }
    if (request.headers.get('X-Secret') !== SECRET) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json', ...CORS },
      });
    }
    if (request.method === 'GET') {
      const stored = await env.DATA.get(KEY);
      return new Response(stored || 'null', {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...CORS },
      });
    }
    if (request.method === 'PUT') {
      const body = await request.text();
      if (body.length > 1024 * 1024) {
        return new Response(JSON.stringify({ error: 'too large' }), {
          status: 413, headers: { 'Content-Type': 'application/json', ...CORS },
        });
      }
      try { JSON.parse(body); } catch (e) {
        return new Response(JSON.stringify({ error: 'invalid json' }), {
          status: 400, headers: { 'Content-Type': 'application/json', ...CORS },
        });
      }
      await env.DATA.put(KEY, body);
      return new Response(JSON.stringify({ ok: true, savedAt: new Date().toISOString() }), {
        headers: { 'Content-Type': 'application/json', ...CORS },
      });
    }
    return new Response(JSON.stringify({ error: 'method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json', ...CORS },
    });
  },
};
