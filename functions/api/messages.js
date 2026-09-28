/* ═══════════ EdgeOne Pages Function: 留言板 API ══════════
   线上地址: /api/messages
   数据源自动选择：
     1) EdgeOne KV        —— 控制台绑定变量名 KV 后自动启用（审核通过后）
     2) EdgeOne Blob      —— @edgeone/pages-blob SDK（无需审批，首次调用自动创建）

   GET  /api/messages → 最新 200 条 [{ n, m, t }]
   POST /api/messages → body { name, content } → 返回新增的那条
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

/* ── KV 模式（env.KV 已绑定时） ── */
async function handleWithKv(request, kv) {
  async function getList() {
    try {
      const list = JSON.parse((await kv.get("messages")) || "[]");
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  if (request.method === "GET") {
    const list = await getList();
    return json(list.slice(-200).reverse());
  }
  if (request.method === "POST") {
    let body = {};
    try { body = await request.json(); } catch (e) {}
    const name = (String(body.name || "").trim() || "匿名朋友").slice(0, 30);
    const content = String(body.content || "").trim().slice(0, 500);
    if (!content) return json({ error: "留言内容不能为空" }, 400);
    const list = await getList();
    const msg = { n: name, m: content, t: Date.now() };
    list.push(msg);
    await kv.put("messages", JSON.stringify(list.slice(-500)));
    return json(msg);
  }
  return json({ error: "method not allowed" }, 405);
}

/* ── Blob 模式（@edgeone/pages-blob SDK） ── */
async function handleWithBlob(request, store) {
  async function getList() {
    try {
      const list = await store.get("messages", { type: "json" });
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  if (request.method === "GET") {
    const list = await getList();
    return json(list.slice(-200).reverse());
  }
  if (request.method === "POST") {
    let body = {};
    try { body = await request.json(); } catch (e) {}
    const name = (String(body.name || "").trim() || "匿名朋友").slice(0, 30);
    const content = String(body.content || "").trim().slice(0, 500);
    if (!content) return json({ error: "留言内容不能为空" }, 400);
    const list = await getList();
    const msg = { n: name, m: content, t: Date.now() };
    list.push(msg);
    await store.setJSON("messages", list.slice(-500));
    return json(msg);
  }
  return json({ error: "method not allowed" }, 405);
}

export async function onRequest({ request, env }) {
  /* ── CORS 预检 ── */
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    /* 优先级 1：KV 已绑定（审核通过后自动切换，代码无需再改） */
    if (env && env.KV) {
      return await handleWithKv(request, env.KV);
    }
    /* 优先级 2：Blob 存储（动态加载，加载失败会被外层捕获而不是炸掉部署）
       consistency: "strong" —— 保证"发完留言立刻能读到"（绕过 CDN 缓存） */
    const mod = await import("@edgeone/pages-blob");
    const getStore = mod.getStore || (mod.default && mod.default.getStore);
    if (typeof getStore !== "function") {
      throw new Error("Blob SDK 加载异常（未找到 getStore）");
    }
    const store = getStore({ name: "guestbook", consistency: "strong" });
    return await handleWithBlob(request, store);
  } catch (e) {
    return json({ error: "服务暂时不可用: " + ((e && e.message) || e) }, 503);
  }
}
