/* ═══════ EdgeOne Pages 留言板 API ═══════
   部署路径: functions/api/messages.js → 线上地址 /api/messages
   存储媒介: EdgeOne KV 存储（需在 Pages 控制台创建命名空间并绑定，
             变量名设为 KV）
   接口:
     GET  /api/messages  → 返回全部留言（最新在前），[{ n, m, t }]
     POST /api/messages  → body: { name, content }，返回新增的那条
*/

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS },
  });
}

async function readList(kv) {
  const raw = (await kv.get("messages")) || "[]";
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  const kv = env && (env.KV || env.KV_NAMESPACE || env.MESSAGES_KV);
  if (!kv) {
    return json({ error: "KV namespace not bound (variable name should be KV)" }, 500);
  }

  try {
    /* ── 读取留言 ── */
    if (request.method === "GET") {
      const list = await readList(kv);
      return json(list.slice(-200).reverse()); // 最新在前，最多展示 200 条
    }

    /* ── 发布留言 ── */
    if (request.method === "POST") {
      let body = {};
      try { body = await request.json(); } catch (e) {}

      const name = (String(body.name || "").trim() || "匿名朋友").slice(0, 30);
      const content = String(body.content || "").trim().slice(0, 500);
      if (!content) {
        return json({ error: "留言内容不能为空" }, 400);
      }

      const list = await readList(kv);
      const msg = { n: name, m: content, t: Date.now() };
      list.push(msg);
      // 只保留最近 500 条，防止 KV 无限膨胀
      await kv.put("messages", JSON.stringify(list.slice(-500)));
      return json(msg);
    }

    return json({ error: "method not allowed" }, 405);
  } catch (e) {
    return json({ error: "server error: " + (e && e.message) }, 500);
  }
}
