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
  }
  /* 默认固定使用「深空绿 · 终端」：不再跟随系统深浅色 / 时段自动换肤。
     想换风格的访客点右下角 🎨 手动选择，选择会被记住。 */

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
    ).join("") +
      '<div class="pop-h">背景氛围</div>' +
      '<button type="button" data-bg=""><span class="sw" data-c="bgdef"></span>🌌 默认氛围</button>' +
      '<button type="button" data-bg="rain"><span class="sw" data-c="bgrain"></span>💻 01 数字雨</button>';

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
    pop.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-bg]");
      if (!b) return;
      if (window.siteBg) window.siteBg(b.dataset.bg);
      try { localStorage.setItem("site-bg", b.dataset.bg); } catch (err) {}
      pop.querySelectorAll("button[data-bg]").forEach((x) => x.classList.toggle("on", x === b));
    });

    document.addEventListener("click", (e) => {
      if (!pop.contains(e.target) && !btn.contains(e.target)) pop.classList.remove("open"); /* btn.contains：波纹 span 在按钮里，不能算点外面 */
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

    /* ⌨️ 快捷键：T 循环换肤 · ? 快捷键帮助浮层 */
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || e.target.isContentEditable) return;
      if (document.body.dataset.keysCapture === "1") return; /* 打字测速等游戏正在捕获按键 */
      if (e.key === "t" || e.key === "T") {
        const ids = THEMES.map((t) => t.id);
        const curT = document.documentElement.dataset.theme || "";
        apply(ids[(ids.indexOf(curT) + 1) % ids.length]);
      } else if (e.key === "?") {
        let help = document.getElementById("keyHelp");
        if (!help) {
          help = document.createElement("div");
          help.id = "keyHelp";
          help.innerHTML = '<div class="kh-box"><h4>⌨️ 快捷键</h4><ul>' +
            '<li><span>全站搜索</span><b>Ctrl / ⌘ + K</b></li>' +
            '<li><span>切换主题（四套循环）</span><b>T</b></li>' +
            '<li><span>相册查看器翻页</span><b>← →</b></li>' +
            '<li><span>关闭弹层 / 搜索</span><b>Esc</b></li>' +
            '<li><span>本帮助</span><b>?</b></li></ul>' +
            '<p>点击任意处关闭</p></div>';
          document.body.appendChild(help);
          help.addEventListener("click", () => help.classList.remove("open"));
        }
        help.classList.toggle("open");
      }
    });

    /* 📊 内页顶部滚动进度条（首页已有 .progress，自动跳过） */
    if (!document.querySelector(".progress") && !document.getElementById("pageProgress")) {
      const pp = document.createElement("div");
      pp.id = "pageProgress";
      document.body.appendChild(pp);
      const updPP = () => {
        const h = document.documentElement;
        const max = h.scrollHeight - h.clientHeight;
        pp.style.width = max > h.clientHeight ? ((h.scrollTop / max) * 100).toFixed(2) + "%" : "0";
      };
      addEventListener("scroll", updPP, { passive: true });
      addEventListener("resize", updPP);
      updPP();
    }

    const cur = document.documentElement.dataset.theme || "";
    pop.querySelectorAll("button[data-t]").forEach((b) => {
      b.classList.toggle("on", b.dataset.t === cur);
    });
    let bgCur = "";
    try { bgCur = localStorage.getItem("site-bg") || ""; } catch (e) {}
    pop.querySelectorAll("button[data-bg]").forEach((b) => {
      b.classList.toggle("on", (b.dataset.bg || "") === bgCur);
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

/* ─────────── ✨ 追光卡：给全站卡片挂 .spot 并写入鼠标位置 ─────────── */
(function () {
  var CARD_SEL = ".skill-card, .project-card, .page-card, .post, .photo, .tool, .ai-card, " +
    ".fcard, .yr-card, .yr-title-card, .prod, .gmsg, .topic, .score-box, .mini-shop, .cab, .contact-box";
  function init() {
    var fine = true;
    try { fine = matchMedia("(pointer: fine)").matches; } catch (e) {}
    if (!fine) return; /* 触屏设备无悬停，跳过 */
    document.querySelectorAll(CARD_SEL).forEach(function (el) { el.classList.add("spot"); });
    document.addEventListener("mousemove", function (e) {
      var el = e.target.closest ? e.target.closest(".spot") : null;
      if (!el) return;
      var r = el.getBoundingClientRect();
      el.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%");
      el.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%");
    }, { passive: true });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

/* ─────────── 🫧 按钮波纹反馈（pointerdown 委托，全站按钮/胶囊） ─────────── */
(function () {
  var SEL = ".btn, .tbtn, .mode-row button, .gbtn, .qr-tabs button, .chip, #themeBtn, #backTopBtn, #pwaInstall, .lb-navs button";
  document.addEventListener("pointerdown", function (e) {
    var b = e.target.closest ? e.target.closest(SEL) : null;
    if (!b || e.button > 0) return;
    var r = b.getBoundingClientRect();
    var size = Math.max(r.width, r.height) * 2.2;
    var s = document.createElement("span");
    s.className = "ripple";
    s.style.cssText = "width:" + size + "px;height:" + size + "px;left:" +
      (e.clientX - r.left - size / 2) + "px;top:" + (e.clientY - r.top - size / 2) + "px;";
    if (getComputedStyle(b).position === "static") b.style.position = "relative";
    b.appendChild(s);
    setTimeout(function () { s.remove(); }, 620);
  }, { passive: true });
})();

/* ─────────── 🚀 Speculation Rules：同站链接悬停即预渲染（Chrome 109+，其余浏览器安全忽略） ─────────── */
(function () {
  try {
    if (!("supports" in HTMLScriptElement) || !HTMLScriptElement.supports("speculationrules")) return;
    var s = document.createElement("script");
    s.type = "speculationrules";
    s.textContent = JSON.stringify({
      prerender: [
        { source: "document", where: { href_matches: "/*" }, eagerness: "moderate" }
      ]
    });
    document.head.appendChild(s);
  } catch (e) {}
})();

/* ─────────── 🌧️ 背景氛围：01 数字雨（site-bg 记忆；canvas z-1 垫底，风格同终端配色） ─────────── */
(function () {
  var canvas = null, timer = 0, cols = [];
  function injectCss() {
    if (document.getElementById("wpBgStyle")) return;
    var st = document.createElement("style");
    st.id = "wpBgStyle";
    st.textContent =
      "#bgRain{position:fixed;inset:0;z-index:-1;pointer-events:none}" +
      "#themePop .pop-h{margin:6px 8px 2px;font-size:11px;color:var(--muted,#8aa39a);letter-spacing:1px;" +
      "border-top:1px solid rgba(255,255,255,.08);padding-top:7px}" +
      '.sw[data-c="bgdef"]{background:#101b17;box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)}' +
      '.sw[data-c="bgrain"]{background:linear-gradient(135deg,#00e5a0 30%,#38bdf8)}';
    document.head.appendChild(st);
  }
  function startRain() {
    if (canvas) return;
    injectCss();
    canvas = document.createElement("canvas");
    canvas.id = "bgRain";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    var W = 0, H = 0, cell = 22, fs = 15, rows = 1;
    function init() {
      var n = Math.max(8, Math.floor(W / cell));
      cols = [];
      for (var i = 0; i < n; i++) cols.push(spawn(true));
    }
    function spawn(anywhere) {
      return {
        row: anywhere ? Math.random() * rows * 1.4 - 4 : -4 - Math.random() * 12,
        v: 6 + Math.random() * 9,                 /* 行/秒 */
        len: 8 + ((Math.random() * 14) | 0),
        rgb: Math.random() < 0.82 ? "0,229,160" : "56,189,248",   /* 终端绿为主 · 站点蓝点缀 */
        cells: []
      };
    }
    function fit() {
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      W = innerWidth; H = innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cell = W < 640 ? 18 : 22; fs = cell - 6;
      rows = H / cell;
      ctx.font = fs + 'px "ui-monospace","Cascadia Mono",Consolas,monospace';
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      init();
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (var ci = 0; ci < cols.length; ci++) {
        var c = cols[ci];
        c.row += c.v * 0.05;                       /* 定时器 50ms 一拍 */
        while (c.cells.length === 0 || c.cells[c.cells.length - 1].r < Math.floor(c.row)) {
          c.cells.push({ r: Math.floor(c.row), ch: Math.random() < 0.5 ? "0" : "1" });
          if (c.cells.length > c.len) c.cells.shift();
        }
        var x = (ci + 0.5) * cell;
        for (var k = 0; k < c.cells.length; k++) {
          var yy = c.cells[k].r * cell;
          if (yy < -cell || yy > H + cell) continue;
          var isHead = k === c.cells.length - 1;
          ctx.fillStyle = isHead ? "#d9ffef" : c.rgb;
          ctx.globalAlpha = isHead ? 0.9 : Math.max(0.05, 0.5 * (1 - (c.cells.length - 1 - k) / c.len));
          ctx.fillText(c.cells[k].ch, x, yy);
        }
        if ((c.row - c.len) * cell > H + 40) cols[ci] = spawn(false);
      }
      ctx.globalAlpha = 1;
    }
    var calm = false;
    try { calm = matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
    fit();
    if (calm) {                 /* 减弱动效：只画一帧静态散布 */
      cols.forEach(function (c) {
        c.row = Math.random() * rows;
        c.cells = [];
        for (var k = 0; k < c.len; k++) c.cells.push({ r: Math.floor(c.row) - k, ch: Math.random() < 0.5 ? "0" : "1" });
      });
      draw();
      return;                   /* 不启动循环 */
    }
    timer = setInterval(function () {
      if (!document.hidden) draw();
    }, 50);
    addEventListener("resize", function () {
      if (!canvas) return;
      fit();
    });
  }
  function stopRain() {
    if (timer) { clearInterval(timer); timer = 0; }
    if (canvas) { canvas.remove(); canvas = null; cols = []; }
  }
  window.siteBg = function (id) {
    if (id === "rain") { stopRain(); startRain(); }
    else stopRain();
  };
  var saved = "";
  try { saved = localStorage.getItem("site-bg") || ""; } catch (e) {}
  function boot() {
    injectCss();
    if (saved === "rain") startRain();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
