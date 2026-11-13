// Cloudflare Pages Function: stores one encrypted sync blob per sync code.
// The browser encrypts everything before upload; this only ever sees ciphertext.
// Requires a KV namespace bound to this Pages project as SYNC.
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

export async function onRequest({ request, env }) {
  const id = new URL(request.url).searchParams.get('id') || '';
  if (!/^[a-f0-9]{64}$/.test(id)) return json({ error: 'bad id' }, 400);
  if (!env.SYNC) return json({ error: 'sync storage not set up' }, 503);
  const key = 'v1:' + id;
  if (request.method === 'GET') {
    const v = await env.SYNC.get(key);
    return new Response(v || 'null', { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
  }
  if (request.method === 'PUT') {
    const body = await request.text();
    if (body.length > 2_000_000) return json({ error: 'too large' }, 413);
    try { const o = JSON.parse(body); if (!o || !o.iv || !o.ct) throw 0; } catch (e) { return json({ error: 'bad body' }, 400); }
    await env.SYNC.put(key, body);
    return json({ ok: true });
  }
  return json({ error: 'method not allowed' }, 405);
}
