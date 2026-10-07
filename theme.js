/* ═══════ 全站主题切换器 ═══════
   在 <head> 里引入：theme.css（样式）+ 本文件。
   尽早把已保存的主题写到 <html data-theme>，避免页面闪色。 */

(function () {
  const KEY = "site-theme";

  /* ── PWA：Service Worker 注册 + 安装入口（全站生效） ── */
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
  let pwaEvent = null;
  addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    pwaEvent = e;
    const b = document.getElementById("pwaInstall");
    if (b) b.style.display = "flex";
  });
  const THEMES = [
    { id: "",       name: "深空绿 · 终端" },
    { id: "violet", name: "紫夜 · 霓虹" },
    { id: "paper",  name: "暖纸 · 印刷" },
    { id: "amber",  name: "墨金 · 鎏金" },
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

    /* 📥 PWA 安装按钮（浏览器允许时出现） */
    const inst = document.createElement("button");
    inst.id = "pwaInstall";
    inst.type = "button";
    inst.setAttribute("aria-label", "把小站安装到桌面 / 手机");
    inst.title = "把小站安装到桌面 / 手机";
    inst.textContent = "📥";
    inst.addEventListener("click", async () => {
      if (!pwaEvent) return;
      pwaEvent.prompt();
      const res = await pwaEvent.userChoice.catch(() => null);
      if (res && res.outcome === "accepted") inst.style.display = "none";
      pwaEvent = null;
    });
    document.body.appendChild(inst);
    if (pwaEvent) inst.style.display = "flex";
    addEventListener("appinstalled", () => { inst.style.display = "none"; });

    /* 滚动时自动隐藏/显示浮动按钮（下滑隐藏 · 上滑出现） */
    let lastY = 0;
    addEventListener("scroll", () => {
      const y = window.scrollY;
      document.body.classList.toggle("fab-hidden", y > lastY + 4 && y > 140);
      lastY = y;
    }, { passive: true });

    /* 📢 标签页离开/回来的小彩蛋 */
    let prevTitle = document.title;
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        prevTitle = document.title;
        document.title = "(⊙_⊙) 别走呀……";
      } else {
        document.title = "!(^^)! 欢迎回来！";
        setTimeout(() => { document.title = prevTitle; }, 1600);
      }
    });

    /* 🎮 Konami 彩蛋：↑↑↓↓←→←→BA 触发自行车雨 */
    const KSEQ = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
    let kIdx = 0;
    document.addEventListener("keydown", (e) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      kIdx = (k === KSEQ[kIdx]) ? kIdx + 1 : (k === KSEQ[0] ? 1 : 0);
      if (kIdx !== KSEQ.length) return;
      kIdx = 0;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      for (let i = 0; i < 24; i++) {
        const p = document.createElement("div");
        p.textContent = "🚲";
        p.style.cssText = "position:fixed;z-index:9999;top:-40px;left:" + (Math.random() * 96).toFixed(1) +
          "vw;font-size:" + (16 + Math.random() * 20).toFixed(0) +
          "px;pointer-events:none;animation:konamiFall " + (2.5 + Math.random() * 3).toFixed(2) + "s linear forwards";
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 6500);
      }
      document.title = "🚲 鹈鹕大军来袭！";
      setTimeout(() => { document.title = prevTitle; }, 2500);
    });

    const cur = document.documentElement.dataset.theme || "";
    pop.querySelectorAll("button[data-t]").forEach((b) => {
      b.classList.toggle("on", b.dataset.t === cur);
    });
  });
})();

/* ─────────── ✨ 高级感细节：终端微倾斜 + 页脚运行状态行 ─────────── */
(function () {
  function init() {
    var calm = false, fine = false;
    try {
      calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
      fine = matchMedia("(pointer: fine)").matches;
    } catch (e) {}

    /* 终端 3D 微倾斜（悬停时暂停漂浮动画，离开恢复） */
    var term = document.querySelector(".terminal");
    if (fine && !calm && term && !term.dataset.tilt) {
      term.dataset.tilt = "1";
      term.addEventListener("mouseenter", function () { term.style.animation = "none"; });
      term.addEventListener("mousemove", function (e) {
        var r = term.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        term.style.transform = "perspective(900px) rotateX(" + (-y * 4).toFixed(2) + "deg) rotateY(" + (x * 5).toFixed(2) + "deg)";
      });
      term.addEventListener("mouseleave", function () {
        term.style.animation = "";
        term.style.transform = "";
      });
    }

    /* 页脚运行状态行（仅首页页脚） */
    var foot = document.querySelector(".footer-inner");
    if (foot && !document.getElementById("sysStatus")) {
      var days = Math.max(1, Math.floor((Date.now() - new Date("2026-09-26T00:00:00+08:00").getTime()) / 86400000));
      var el = document.createElement("div");
      el.id = "sysStatus";
      el.className = "sys-status";
      el.innerHTML = '<span style="color:var(--accent)">●</span> SYSTEM ONLINE · 已稳定运行 ' + days + ' 天 · 与 AI 结对手工维护';
      foot.appendChild(el);
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
