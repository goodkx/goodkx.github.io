/* ═══════════ EdgeOne Pages Function: 留言板 API ══════════
   线上地址: /api/messages
   存储: EdgeOne KV（控制台绑定命名空间，变量名 KV）

   GET  /api/messages → 最新 200 条 [{ n, m, t }]
   POST /api/messages → body { n, m } → 新增的那条
*/

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS_HEADERS },
  });
}

async function getList(kv) {
  const raw = (await kv.get("messages")) || "[]";
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function onRequest({ request, env }) {
  /* ── CORS 预检 ── */
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  /* ── KV 未绑定检查 ── */
  const kv = env && env.KV;
  if (!kv) {
    return json({ error: "KV 变量未绑定（控制台变量名需为 KV）" }, 503);
  }

  /* ── GET：读取最新留言（最新在前，最多 200 条）── */
  if (request.method === "GET") {
    const list = await getList(kv);
    return json(list.slice(-200).reverse());
  }

  /* ── POST：发布留言 ── */
  if (request.method === "POST") {
    let body = {};
    try { body = await request.json(); } catch (e) {}

    const name = (String(body.name || "").trim() || "匿名朋友").slice(0, 30);
    const content = String(body.content || "").trim().slice(0, 500);
    if (!content) {
      return json({ error: "留言内容不能为空" }, 400);
    }

    const list = await getList(kv);
    const msg = { n: name, m: content, t: Date.now() };
    list.push(msg);
    await kv.put("messages", JSON.stringify(list.slice(-500)));
    return json(msg);
  }

  return json({ error: "method not allowed" }, 405);
}
