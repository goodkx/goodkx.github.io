/* ─────────── CCCAD 小站 Service Worker ───────────
   策略：
   - 页面导航（HTML）：网络优先，失败回退缓存 → 离线也能看
   - 静态资源（CSS/JS/图片/字体）：缓存优先 + 后台更新（SWR）
   - 跨域请求（textdb 云数据等）：直连不缓存，保证数据最新
   - 离线兜底页：offline.html                              */

const CACHE = "cccad-v1";
const OFFLINE_URL = "offline.html";

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll([OFFLINE_URL])).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return; /* POST（发布留言/下单等）直连网络 */
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; /* 跨域（textdb 等）直连，保证最新 */

  /* 页面导航：网络优先 → 缓存 → 离线页 */
  if (req.mode === "navigate" || req.destination === "document") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req, { ignoreSearch: true }).then((m) => m || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  /* 同源静态资源：缓存优先 + 后台更新 */
  if (["style", "script", "image", "font"].includes(req.destination)) {
    e.respondWith(
      caches.match(req).then((cached) => {
        const net = fetch(req)
          .then((res) => {
            if (res && res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return res;
          })
          .catch(() => cached);
        return cached || net;
      })
    );
  }
});
