/* ═══════════════════════════════════════════════
   个人主页交互脚本
   终端打字机 / 角色轮播 / 滚动显现 / 导航 / 小工具
   ═══════════════════════════════════════════════ */

const $  = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ─────────── 终端窗口：逐字打命令 ─────────── */
const termLines = [
  { type: "cmd", text: "whoami" },
  { type: "out", text: "CCCAD —— 一个热爱创造的人" },
  { type: "cmd", text: "cat motto.txt" },
  { type: "out", text: "保持好奇 · 持续学习 · 快速行动" },
  { type: "cmd", text: "./welcome.sh" },
  { type: "out", text: "欢迎来到我的数字小站 🚀" },
];

function renderTerminalLine(line) {
  const el = document.createElement("div");
  el.className = "t-line " + (line.type === "cmd" ? "t-cmd" : "t-out");
  el.innerHTML =
    line.type === "cmd"
      ? '<span class="t-prompt">➜ ~ </span><span class="t-text"></span>'
      : '<span class="t-text"></span>';
  el.querySelector(".t-text").textContent = line.text;
  return el;
}

async function runTerminal() {
  const body = $("#terminalBody");
  if (!body) return;

  if (prefersReduced) {
    termLines.forEach((l) => body.appendChild(renderTerminalLine(l)));
  } else {
    for (const line of termLines) {
      const el = renderTerminalLine({ ...line, text: "" });
      body.appendChild(el);
      const text = el.querySelector(".t-text");
      if (line.type === "cmd") {
        for (const ch of line.text) {
          text.textContent += ch;
          await sleep(40 + Math.random() * 70);
        }
        await sleep(380);
      } else {
        text.textContent = line.text;
        await sleep(260);
      }
    }
  }

  // 结尾闪烁光标
  const cur = document.createElement("div");
  cur.className = "t-line t-cmd";
  cur.innerHTML = '<span class="t-prompt">➜ ~ </span><span class="caret"></span>';
  body.appendChild(cur);
}

/* ─────────── Hero 角色打字轮播 ─────────── */
const roles = ["造轮子的人", "AI 结对搭子", "踩坑记录员", "把想法做成真东西", "手写 HTML 的稀有物种", "git push 幸存者", "凌晨改样式的艺术家"];

async function typeRoles() {
  const el = $("#typed");
  if (!el) return;
  if (prefersReduced) {
    el.textContent = roles[0];
    return;
  }
  let i = 0;
  for (;;) {
    const word = roles[i % roles.length];
    for (let c = 1; c <= word.length; c++) {
      el.textContent = word.slice(0, c);
      await sleep(120);
    }
    await sleep(1700);
    for (let c = word.length; c >= 0; c--) {
      el.textContent = word.slice(0, c);
      await sleep(55);
    }
    await sleep(320);
    i++;
  }
}

/* ─────────── 滚动显现动画 ─────────── */
function initReveal() {
  const items = $$(".reveal");
  if (prefersReduced || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("visible"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  items.forEach((el) => io.observe(el));
}

/* ─────────── 导航：玻璃 Dock + 魔法胶囊 + 滚动伸缩 + 移动端菜单 ─────────── */
function initNav() {
  const links = $("#navLinks");
  const toggle = $("#navToggle");
  const nav = $(".nav");
  const pill = $("#dockPill");
  const fine = window.matchMedia && matchMedia("(pointer: fine)").matches &&
    !matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      toggle.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
      if (open && nav) nav.classList.remove("hide");   /* 菜单开着时 Dock 不许藏 */
    });
    $$(".nav-links a").forEach((a) =>
      a.addEventListener("click", () => {
        links.classList.remove("open");
        toggle.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      })
    );
  }

  /* 魔法胶囊：滑到当前激活项脚下 */
  function movePill() {
    if (!pill) return;
    const act = links ? links.querySelector("a.active") : null;
    if (!act || innerWidth <= 960) { pill.classList.remove("show"); return; }
    const lr = links.getBoundingClientRect();
    const ar = act.getBoundingClientRect();
    pill.style.left = (ar.left - lr.left) + "px";
    pill.style.width = ar.width + "px";
    pill.classList.add("show");
  }

  /* Dock 放大镜：指针越近越浮起（仅精确指针） */
  const dock = $("#navDock");
  if (dock && fine) {
    dock.addEventListener("pointermove", (e) => {
      $$(".nav-links a").forEach((a) => {
        const r = a.getBoundingClientRect();
        const dx = Math.abs(e.clientX - (r.left + r.width / 2));
        const mag = Math.max(0, 1 - dx / 260);
        a.style.transform = "translateY(" + (-2.5 * mag).toFixed(1) + "px) scale(" + (1 + mag * 0.06).toFixed(3) + ")";
      });
    }, { passive: true });
    dock.addEventListener("pointerleave", () => {
      $$(".nav-links a").forEach((a) => (a.style.transform = ""));
    });
  }

  const sections = $$("main section[id]");
  const progress = $("#progress");
  const navLinks = $$(".nav-links a");
  let lastY = 0;

  const onScroll = () => {
    const y = window.scrollY + 130;
    let current = "";
    sections.forEach((s) => {
      if (s.offsetTop <= y) current = s.id;
    });
    navLinks.forEach((a) =>
      a.classList.toggle("active", a.getAttribute("href") === "#" + current)
    );
    movePill();
    if (progress) {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      progress.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
    }
    /* 下滑藏、上滑现；顶部常驻 */
    const wy = window.scrollY;
    if (nav) {
      nav.classList.toggle("scrolled", wy > 30);
      if (wy > 160 && wy > lastY + 6) nav.classList.add("hide");
      else if (wy < lastY - 6 || wy <= 160) nav.classList.remove("hide");
    }
    lastY = wy;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", movePill);
  onScroll();
  setTimeout(movePill, 400);

    /* 04 区：实时在站天数 */
    const gd = document.getElementById("glogDays");
    if (gd) gd.textContent = Math.max(1, Math.round((Date.now() - new Date("2026-09-26T00:00:00+08:00")) / 864e5));
}

/* ─────────── Toast 提示 ─────────── */
let toastTimer = null;
function showToast(msg) {
  const toast = $("#toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

/* ─────────── 复制邮箱 ─────────── */
function initCopyEmail() {
  const btn = $("#copyEmail");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    const email = btn.dataset.email;
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = email;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    showToast("已复制到剪贴板 ✓");
  });
}

/* ─────────── 页面导航卡片：未创建的页面点击给提示 ─────────── */
function initPageCards() {
  $$(".page-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      const href = card.getAttribute("href");
      if (!href || href === "#") {
        e.preventDefault();
        showToast(
          card.dataset.toast ||
            "这个页面还没创建 —— 把卡片链接换成你的页面地址"
        );
      }
    });
  });
}

/* ─────────── 鼠标跟随光晕（仅桌面） ─────────── */
function initCursorGlow() {
  if (prefersReduced || !window.matchMedia("(pointer: fine)").matches) return;
  const glow = document.createElement("div");
  glow.id = "cursor-glow";
  document.body.appendChild(glow);

  let x = innerWidth / 2, y = innerHeight / 2, gx = x, gy = y;
  addEventListener("mousemove", (e) => {
    x = e.clientX;
    y = e.clientY;
  }, { passive: true });

  (function loop() {
    gx += (x - gx) * 0.08;
    gy += (y - gy) * 0.08;
    glow.style.transform = `translate(${gx - 250}px, ${gy - 250}px)`;
    requestAnimationFrame(loop);
  })();
}

/* ─────────── 页脚年份 ─────────── */
function initYear() {
  const y = $("#year");
  if (y) y.textContent = new Date().getFullYear();
}

/* ─────────── 页脚每日一言（本地轮换，零依赖） ─────────── */
const QUOTES = [
  "代码能跑就别动它——但如果它是我写的，那必须动。",
  "先完成，再完美，最后假装一开始就是想这样。",
  "慢慢来，比较快；急事最容易返工两遍。",
  "世上没有疑难 bug，只有还没打出来的 console.log。",
  "种一棵树最好的时间是十年前，其次是被产品催的现在。",
  "AI 负责快，我负责对，用户负责用——各司其职。",
  "今天的坑是明天的博客，明天的博客是后天的简历。",
  "简约比复杂更难——因为复杂只需要堆，简约需要删。",
  "在不确定的世界里，做确定的事：比如保存一下。",
  "别收藏了，动手敲一遍，收藏夹不会替你学会。",
  "每个『就改一行』的深夜，都值得一次完整的回归测试。",
  "代码和生活一样：跑不通就打断点，一步一步来。",
];
function initQuote() {
  const el = $("#dailyQuote");
  if (!el) return;
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const day = Math.floor((now - start) / 864e5);
  el.textContent = "💬 " + QUOTES[day % QUOTES.length];
}

/* ─────────── 启动 ─────────── */
document.addEventListener("DOMContentLoaded", () => {
  initReveal();
  initNav();
  initCopyEmail();
  initPageCards();
  initCursorGlow();
  initYear();
  initQuote();
  setTimeout(() => {
    runTerminal();
    typeRoles();
  }, 500);
});

/* ═══ 🐋 线条聚形：几百条小直线散开漂浮 → 排列组合成鲸鱼/看板娘 → 再散开，无限循环 ═══ */
(function () {
  function init() {
    if (!document.body.classList.contains("page-home")) return;
    var calm = false;
    try { calm = matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

    var canvas = document.createElement("canvas");
    canvas.id = "bgLines";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    var ctx = canvas.getContext("2d");

    /* 形象库：纯描边路径（viewBox 内坐标），渲染到离屏后采样轮廓 */
    var SHAPES = [
      { vb: [120, 72], paths: [
        "M15 42 Q30 18 65 16 Q92 15 100 34 Q104 42 98 50 Q80 64 45 62 Q22 60 15 42 Z",
        "M15 42 Q5 30 2 20",
        "M15 42 Q4 50 3 60",
        "M30 54 Q45 58 62 55",
        "M34 58 Q46 61 58 59",
        "M55 52 Q60 62 72 59",
        "M80 13 Q82 4 90 6",
        "M80 13 Q76 6 70 8"
      ]},
      { vb: [100, 130], paths: [
        "M38 48 Q36 60 30 78 Q28 88 40 90 L60 90 Q72 88 70 78 Q64 60 62 48",
        "M38 52 Q28 62 34 70",
        "M62 52 Q72 62 66 70",
        "M42 48 L50 54 L58 48",
        "M44 90 L44 100",
        "M56 90 L56 100",
        "M33 26 Q50 12 67 26",
        "M33 22 Q14 30 16 62 Q17 70 24 66",
        "M67 22 Q86 30 84 62 Q83 70 76 66",
        "M31 17 Q50 5 69 17",
        "M43 34 Q45 36 47 34",
        "M53 34 Q55 36 57 34",
        "M46 42 Q50 45 54 42"
      ]}
    ];
    var shapeIdx = 0;

    var W = 0, H = 0, segs = [], targets = null, mode = "drift", phaseT = 0;
    var PAL = window.__themeRGB ? window.__themeRGB() : ["0,229,160", "56,189,248"];
    document.addEventListener("themechange", function () { PAL = window.__themeRGB(); });
    var mouse = { x: -9999, y: -9999 };
    var CAP = innerWidth < 640 ? 260 : 480;
    var DT = 30, scatterT = 1.6, formT = 4.2, holdT = 2.4;

    function fit() {
      var dpr = Math.min(2, devicePixelRatio || 1);
      W = innerWidth; H = innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      targets = null;   /* 触发重采样 */
    }

    /* 采样形象轮廓：描边渲染 → 取边缘像素 → 计算每点切线角 */
    function sample() {
      var sp = SHAPES[shapeIdx];
      var box = Math.min(W * 0.56, H * 0.62, 640);
      var sc = box / Math.max(sp.vb[0], sp.vb[1]);
      var w = sp.vb[0] * sc, h = sp.vb[1] * sc;
      var ox = W * 0.42 - w / 2, oy = H * 0.38 - h / 2;
      var off = document.createElement("canvas");
      off.width = W; off.height = H;
      var c = off.getContext("2d");
      c.translate(ox, oy); c.scale(sc, sc);
      c.strokeStyle = "#fff"; c.lineCap = "round"; c.lineJoin = "round";
      c.lineWidth = 2.6 / sc;
      sp.paths.forEach(function (p) { c.stroke(new Path2D(p)); });
      var img = c.getImageData(0, 0, W, H).data;
      var pts = [];
      var step = W < 640 ? 4 : 3;
      for (var y = 0; y < H; y += step) {
        for (var x = 0; x < W; x += step) {
          var i4 = (y * W + x) * 4 + 3;
          if (img[i4] > 60) {
            var edge =
              x === 0 || y === 0 || x === W - step || y === H - step ||
              img[i4 - 4] < 60 || img[i4 + 4] < 60 ||
              img[i4 - W * 4] < 60 || img[i4 + W * 4] < 60;
            if (edge) pts.push({ x: x, y: y });
          }
        }
      }
      /* 抽稀到段数上限 */
      if (pts.length > CAP) {
        var keep = [], stp = pts.length / CAP;
        for (var k = 0; k < CAP; k++) keep.push(pts[(k * stp) | 0]);
        pts = keep;
      }
      /* 切线角：最近邻方向 */
      for (var a = 0; a < pts.length; a++) {
        var best = 1e9, bang = 0;
        for (var b = 0; b < pts.length; b++) {
          if (b === a) continue;
          var dd = (pts[a].x - pts[b].x) * (pts[a].x - pts[b].x) + (pts[a].y - pts[b].y) * (pts[a].y - pts[b].y);
          if (dd < best) { best = dd; bang = Math.atan2(pts[a].y - pts[b].y, pts[a].x - pts[b].x); }
        }
        pts[a].ang = bang;
      }
      targets = pts;
      /* 段数对齐 */
      while (segs.length > targets.length) segs.pop();
      while (segs.length < targets.length) {
        segs.push({
          x: Math.random() * W, y: Math.random() * H,
          a: Math.random() * Math.PI * 2, va: (Math.random() - 0.5) * 0.06,
          vx: (Math.random() - 0.5) * 1.6, vy: (Math.random() - 0.5) * 1.6,
          len: 6 + Math.random() * 9,
          ci: Math.random() < 0.8 ? 0 : 1,
          al: 0.35 + Math.random() * 0.5
        });
      }
    }

    function shortest(a) { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; }

    function kick() {
      var cx = W / 2, cy = H * 0.38;
      for (var i = 0; i < segs.length; i++) {
        var s = segs[i];
        var dx = s.x - cx, dy = s.y - cy, d = Math.hypot(dx, dy) || 1;
        var f = Math.min(14, 700 / d);
        s.vx += (dx / d) * f + (Math.random() - 0.5) * 3;
        s.vy += (dy / d) * f + (Math.random() - 0.5) * 3;
        s.va = (Math.random() - 0.5) * 0.14;
      }
    }

    var last = performance.now();
    function frame(now) {
      var dt = Math.min(0.05, (now - last) / 1000) || 0.016;
      last = now;
      phaseT += dt;
      ctx.clearRect(0, 0, W, H);
      var t = now / 1000;

      if (mode === "drift" && phaseT > scatterT) {
        sample(); mode = "form"; phaseT = 0;
      } else if (mode === "form" && phaseT > formT + holdT) {
        kick(); mode = "drift"; phaseT = 0;
        shapeIdx = (shapeIdx + 1) % SHAPES.length;
        targets = null;
      }

      for (var i = 0; i < segs.length; i++) {
        var s = segs[i];
        if (mode === "form" && targets && targets[i]) {
          var tg = targets[i];
          s.vx += (tg.x - s.x) * 0.09; s.vy += (tg.y - s.y) * 0.09;
          s.a += shortest(tg.ang - s.a) * 0.14;
          s.va *= 0.9;
        } else {
          s.vx += (Math.random() - 0.5) * 0.12; s.vy += (Math.random() - 0.5) * 0.12;
          s.a += s.va;
          if (s.x < -20) s.vx += 0.6; if (s.x > W + 20) s.vx -= 0.6;
          if (s.y < -20) s.vy += 0.6; if (s.y > H + 20) s.vy -= 0.6;
        }
        /* 鼠标排斥 */
        var dx = s.x - mouse.x, dy = s.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 8100) {
          var d = Math.sqrt(d2) || 1, f = ((90 - d) / 90) * 6;
          s.vx += (dx / d) * f; s.vy += (dy / d) * f;
        }
        s.vx *= 0.92; s.vy *= 0.92;
        s.x += s.vx * dt * 60; s.y += s.vy * dt * 60;

        var hl = s.len / 2;
        ctx.globalAlpha = s.al;
        ctx.strokeStyle = "rgb(" + PAL[s.ci] + ")";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(s.x - Math.cos(s.a) * hl, s.y - Math.sin(s.a) * hl);
        ctx.lineTo(s.x + Math.cos(s.a) * hl, s.y + Math.sin(s.a) * hl);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    document.addEventListener("pointermove", function (e) { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    document.addEventListener("pointerleave", function () { mouse.x = -9999; mouse.y = -9999; });
    document.addEventListener("visibilitychange", function () { last = performance.now(); });
    addEventListener("resize", fit);

    fit();
    if (calm) {
      /* 减弱动效：只画一次聚合成鲸鱼的静帧 */
      sample(); mode = "form";
      for (var i = 0; i < segs.length; i++) { segs[i].x = targets[i].x; segs[i].y = targets[i].y; segs[i].a = targets[i].ang; }
      frame(performance.now());
      return;
    }
    setInterval(function () { frame(performance.now()); }, DT);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
