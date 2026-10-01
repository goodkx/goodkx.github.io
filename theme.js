/* ═══════ 全站主题切换器 ═══════
   在 <head> 里引入：theme.css（样式）+ 本文件。
   尽早把已保存的主题写到 <html data-theme>，避免页面闪色。 */

(function () {
  const KEY = "site-theme";
  const THEMES = [
    { id: "",       name: "深空绿 · 默认" },
    { id: "violet", name: "紫夜" },
    { id: "paper",  name: "暖纸 · 日间" },
    { id: "amber",  name: "墨金 · OLED" },
  ];

  // 解析到本脚本时立即应用（此时正文尚未渲染）
  let saved = "";
  try { saved = localStorage.getItem(KEY) || ""; } catch (e) {}
  if (saved) {
    document.documentElement.dataset.theme = saved;
  } else {
    /* 从未手动选过主题：跟随系统深浅色偏好 + 白天因子；
       一旦手动切换过任何主题，以手动选择为准，不再自动变 */
    let sysLight = false;
    try { sysLight = window.matchMedia("(prefers-color-scheme: light)").matches; } catch (e) {}
    const h = new Date().getHours();
    if (h >= 7 && h < 19 && sysLight) document.documentElement.dataset.theme = "paper";
  }

  function apply(id) {
    if (id) document.documentElement.dataset.theme = id;
    else delete document.documentElement.dataset.theme;
    try { localStorage.setItem(KEY, id); } catch (e) {}
    document.querySelectorAll("#themePop button").forEach((b) => {
      b.classList.toggle("on", b.dataset.t === id);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.createElement("button");
    btn.id = "themeBtn";
    btn.type = "button";
    btn.title = "切换主题风格";
    btn.setAttribute("aria-label", "切换主题风格");
    btn.textContent = "🎨";

    const pop = document.createElement("div");
    pop.id = "themePop";
    pop.innerHTML = THEMES.map(
      (t) =>
        `<button type="button" data-t="${t.id}"><span class="sw" data-c="${t.id}"></span>${t.name}</button>`
    ).join("");

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      pop.classList.toggle("open");
    });

    pop.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-t]");
      if (!b) return;
      apply(b.dataset.t);
      pop.classList.remove("open");
    });

    document.addEventListener("click", (e) => {
      if (!pop.contains(e.target) && e.target !== btn) pop.classList.remove("open");
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") pop.classList.remove("open");
    });

    document.body.appendChild(pop);
    document.body.appendChild(btn);

    /* 全站浮动返回顶部（滚动进度环） */
    const top = document.createElement("button");
    top.id = "backTopBtn";
    top.type = "button";
    top.setAttribute("aria-label", "返回顶部");
    top.innerHTML = '<svg class="ring" viewBox="0 0 44 44" aria-hidden="true">' +
      '<defs><linearGradient id="btGrad" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#00e5a0"/><stop offset="1" stop-color="#38bdf8"/>' +
      '</linearGradient></defs>' +
      '<circle class="ring-bg" cx="22" cy="22" r="19"/>' +
      '<circle class="ring-fg" cx="22" cy="22" r="19"/></svg>' +
      '<span class="ar"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg></span>';
    top.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    const toggleTop = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const p = max > 0 ? Math.min(1, h.scrollTop / max) : 0;
      top.classList.toggle("show", window.scrollY > 300);
      const fg = top.querySelector(".ring-fg");
      if (fg) fg.style.strokeDashoffset = String((119.4 * (1 - p)).toFixed(1));
    };
    addEventListener("scroll", toggleTop, { passive: true });
    document.body.appendChild(top);
    toggleTop();

    const cur = document.documentElement.dataset.theme || "";
    pop.querySelectorAll("button[data-t]").forEach((b) => {
      b.classList.toggle("on", b.dataset.t === cur);
    });
  });
})();
