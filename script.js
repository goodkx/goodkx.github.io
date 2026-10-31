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

/* ═══ 🐋 线条聚形 · 精修版：直线群组形 → 散开 → 再组形，无限循环 ═══ */
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

    var SHAPES = [
      { vb: [120, 72], paths: [
        "M15 42 Q30 18 65 16 Q92 15 100 34 Q104 42 98 50 Q80 64 45 62 Q22 60 15 42 Z",
        "M15 42 Q5 30 2 20",
        "M15 42 Q4 50 3 60",
        "M28 52 Q48 58 76 50",
        "M31 56 Q48 61 72 54",
        "M34 59 Q48 63 66 58",
        "M55 52 Q60 62 72 59",
        "M70 44 Q82 47 93 41",
        "M78 30 Q80 33 82 30",
        "M80 13 Q82 4 90 6",
        "M80 13 Q76 6 70 8",
        "M86 2 Q88 -1 91 1",
        "M74 3 Q72 0 69 2",
        "M92 8 Q95 6 97 8"
      ]},
      { vb: [100, 132], paths: [
        "M35 24 Q33 44 50 47 Q67 44 65 24 Q63 10 50 10 Q37 10 35 24",
        "M33 22 Q35 8 50 7 Q65 8 67 22",
        "M40 20 Q44 13 48 20",
        "M52 19 Q56 12 60 19",
        "M33 22 Q29 31 34 38",
        "M67 22 Q71 31 66 38",
        "M31 20 Q10 26 12 58 Q13 70 22 68 Q26 66 24 56 Q22 40 34 30",
        "M69 20 Q90 26 88 58 Q87 70 78 68 Q74 66 76 56 Q78 40 66 30",
        "M30 24 Q27 28 29 31",
        "M70 24 Q73 28 71 31",
        "M31 14 Q50 2 69 14",
        "M36 10 Q39 5 43 9",
        "M46 6 Q50 3 54 6",
        "M57 8 Q61 4 64 9",
        "M40 32 Q42 27 45 32 Q43 36 40 32",
        "M55 32 Q57 27 60 32 Q58 36 55 32",
        "M36 38 Q38 40 40 38",
        "M60 38 Q62 40 64 38",
        "M47 41 Q50 43 53 41",
        "M38 50 Q34 62 32 74 Q31 82 38 84 L62 84 Q69 82 68 74 Q66 62 62 50",
        "M42 52 L40 80",
        "M58 52 L60 80",
        "M40 80 Q50 84 60 80",
        "M32 74 Q36 78 40 74 Q44 78 48 74 Q52 78 56 74 Q60 78 64 74 Q67 77 68 74",
        "M38 51 Q26 58 30 68 Q32 72 36 70",
        "M30 66 Q33 69 36 66",
        "M62 51 Q74 58 70 68 Q68 72 64 70",
        "M70 66 Q67 69 64 66",
        "M40 74 Q50 80 60 74 Q50 68 40 74",
        "M44 84 L43 96",
        "M56 84 L57 96",
        "M40 97 Q43 100 46 97",
        "M54 97 Q57 100 60 97"
      ]}
    ];
    var shapeIdx = 0;

    var W = 0, H = 0, segs = [], targets = null, mode = "drift", phaseT = 0;
    var PAL = null;
    function readPal() {
      try {
        var cs = getComputedStyle(document.documentElement);
        var a = (cs.getPropertyValue("--accent-rgb") || "").trim() || "91,140,255";
        var b = (cs.getPropertyValue("--accent-2-rgb") || "").trim() || "125,211,252";
        PAL = [a, b];
      } catch (e) { PAL = ["91,140,255", "125,211,252"]; }
    }
    document.addEventListener("themechange", function () { readPal(); });
    readPal();

    var mouse = { x: -9999, y: -9999 };
    var CAP = innerWidth < 640 ? 520 : 1050;
    var scatterT = 1.7, formT = 4.4, holdT = 2.6;
    var frames = 0, frameErr = "none";

    function fit() {
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      W = innerWidth; H = innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      targets = null;
    }

    function sample() {
      var sp = SHAPES[shapeIdx];
      var box = Math.min(W * 0.56, H * 0.64, 680);
      var sc = box / Math.max(sp.vb[0], sp.vb[1]);
      var w = sp.vb[0] * sc, h = sp.vb[1] * sc;
      var ox = W * 0.42 - w / 2, oy = H * 0.38 - h / 2;
      var off = document.createElement("canvas");
      off.width = W; off.height = H;
      var c = off.getContext("2d");
      c.translate(ox, oy); c.scale(sc, sc);
      c.strokeStyle = "#fff"; c.lineCap = "round"; c.lineJoin = "round";
      c.lineWidth = 2.4 / sc;
      sp.paths.forEach(function (p) { c.stroke(new Path2D(p)); });
      var img = c.getImageData(0, 0, W, H).data;
      var pts = [];
      var step = W < 640 ? 3 : 2;
      for (var y = 0; y < H; y += step) {
        for (var x = 0; x < W; x += step) {
          var i4 = (y * W + x) * 4 + 3;
          if (img[i4] > 60) {
            var edge = x < step || y < step || x >= W - step || y >= H - step ||
              img[i4 - 4] < 60 || img[i4 + 4] < 60 ||
              img[i4 - W * 4] < 60 || img[i4 + W * 4] < 60;
            if (edge) pts.push({ x: x, y: y });
          }
        }
      }
      if (pts.length > CAP) {
        var keep = [], stp = pts.length / CAP;
        for (var k = 0; k < CAP; k++) keep.push(pts[(k * stp) | 0]);
        pts = keep;
      }
      for (var a = 0; a < pts.length; a++) {
        var best = 1e18, bang = 0;
        for (var b = 0; b < pts.length; b++) {
          if (b === a) continue;
          var ddx = pts[a].x - pts[b].x, ddy = pts[a].y - pts[b].y;
          var dd = ddx * ddx + ddy * ddy;
          if (dd < best) { best = dd; bang = Math.atan2(ddy, ddx); }
        }
        pts[a].ang = bang;
      }
      targets = pts;
      while (segs.length > targets.length) segs.pop();
      while (segs.length < targets.length) {
        segs.push({
          x: Math.random() * W, y: Math.random() * H,
          a: Math.random() * Math.PI * 2, va: (Math.random() - 0.5) * 0.05,
          vx: (Math.random() - 0.5) * 1.4, vy: (Math.random() - 0.5) * 1.4,
          len: 4.5 + Math.random() * 4,
          ci: Math.random() < 0.8 ? 0 : 1,
          al: 0.4 + Math.random() * 0.5,
          dl: Math.random() * 0.5
        });
      }
    }

    function shortest(a) { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; }

    function kick() {
      var cx = W * 0.42, cy = H * 0.38;
      for (var i = 0; i < segs.length; i++) {
        var s = segs[i];
        var dx = s.x - cx, dy = s.y - cy, d = Math.hypot(dx, dy) || 1;
        var f = Math.min(13, 750 / d);
        s.vx += (dx / d) * f + (Math.random() - 0.5) * 2.5;
        s.vy += (dy / d) * f + (Math.random() - 0.5) * 2.5;
        s.va = (Math.random() - 0.5) * 0.12;
      }
    }

    var last = performance.now();
    function frame(now) {
      frames++;
      try {
        var dt = Math.min(0.05, (now - last) / 1000) || 0.016;
        last = now;
        phaseT += dt;
        ctx.clearRect(0, 0, W, H);
        var t = now / 1000;

        if (mode === "drift" && phaseT > scatterT) {
          sample(); mode = "form"; phaseT = 0;
          for (var d = 0; d < segs.length; d++) segs[d].dl = (d % 50) * 0.012 + Math.random() * 0.22;
        } else if (mode === "form" && phaseT > formT + holdT) {
          kick(); mode = "drift"; phaseT = 0;
          shapeIdx = (shapeIdx + 1) % SHAPES.length;
          targets = null;
        }

        for (var i = 0; i < segs.length; i++) {
          var s = segs[i];
          var forming = mode === "form" && targets && targets[i] && phaseT > s.dl;
          if (forming) {
            var tg = targets[i];
            s.vx += (tg.x - s.x) * 0.11; s.vy += (tg.y - s.y) * 0.11;
            s.a += shortest(tg.ang - s.a) * 0.16;
            s.va *= 0.85;
          } else {
            s.vx += (Math.random() - 0.5) * 0.11; s.vy += (Math.random() - 0.5) * 0.11;
            s.a += s.va;
            if (s.x < -20) s.vx += 0.5; if (s.x > W + 20) s.vx -= 0.5;
            if (s.y < -20) s.vy += 0.5; if (s.y > H + 20) s.vy -= 0.5;
          }
          var dx = s.x - mouse.x, dy = s.y - mouse.y, d2 = dx * dx + dy * dy;
          if (d2 < 8100) {
            var dd = Math.sqrt(d2) || 1, f = ((90 - dd) / 90) * 6;
            s.vx += (dx / dd) * f; s.vy += (dy / dd) * f;
          }
          s.vx *= 0.92; s.vy *= 0.92;
          s.x += s.vx * dt * 60; s.y += s.vy * dt * 60;

          var breathe = (mode === "form" && phaseT > formT) ? Math.sin(t * 2 + i * 0.35) * 0.7 : 0;
          var hl = s.len / 2;
          var ca = Math.cos(s.a) * hl, sa = Math.sin(s.a) * hl;
          var x1 = s.x - ca, y1 = s.y - sa + breathe, x2 = s.x + ca, y2 = s.y + sa + breathe;
          ctx.strokeStyle = "rgb(" + PAL[s.ci] + ")";
          ctx.globalAlpha = s.al * 0.22;
          ctx.lineWidth = 3.2;
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
          ctx.globalAlpha = s.al;
          ctx.lineWidth = 1.25;
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      } catch (e) {
        if (frameErr === "none") frameErr = (e.message || "?") + " @ " + String(e.stack || "").split("\n")[1];
      }
    }

    document.addEventListener("pointermove", function (e) { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    document.addEventListener("pointerleave", function () { mouse.x = -9999; mouse.y = -9999; });
    document.addEventListener("visibilitychange", function () { last = performance.now(); });
    addEventListener("resize", fit);

    fit();
    window.__dbg = function () {
      return { mode: mode, segs: segs.length, tg: targets ? targets.length : -1,
               phaseT: +phaseT.toFixed(1), frames: frames, frameErr: frameErr,
               shape: SHAPES[shapeIdx] === SHAPES[0] ? "whale" : "girl" };
    };
    if (calm) {
      sample(); mode = "form";
      for (var i = 0; i < segs.length; i++) { segs[i].x = targets[i].x; segs[i].y = targets[i].y; segs[i].a = targets[i].ang; }
      frame(performance.now());
      return;
    }
    setInterval(function () { frame(performance.now()); }, 30);
  }
  try {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  } catch (e) { window.__morphErr = (e.message || "?"); }
})();
