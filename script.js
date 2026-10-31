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

/* ═══ 🐋 粒子看板娘 · 最终版：粒子取自鲸鲸视频帧（位置+颜色双复原），双姿态轮换 ═══ */
(function () {
  function init() {
    var hero = document.getElementById("hero");
    var host = document.querySelector(".hero-terminal .terminal") || hero;
    if (!hero || hero.dataset.particles) return;
    var calm = false;
    try { calm = matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

    var canvas = document.createElement("canvas");
    canvas.id = "particleHero";
    canvas.setAttribute("aria-hidden", "true");
    host.appendChild(canvas);
    var ctx = canvas.getContext("2d");

    /* 两个姿态源：待机 ⇄ 吃糖葫芦 */
    var SHAPES = ["idle.webm", "tanghulu.webm"];
    var shapeIdx = 0, W = 0, H = 0, parts = [], targets = [];
    var morphT = performance.now(), hidden = false, last = 0;
    var mouse = { x: -9999, y: -9999 };

    /* 隐藏视频：鲸鲸本尊的姿态源（提前预载） */
    var petVids = {};
    function getVid(file) {
      if (!petVids[file]) {
        var v = document.createElement("video");
        v.src = "pet/" + file;
        v.muted = true; v.loop = true; v.autoplay = true;
        v.setAttribute("playsinline", ""); v.preload = "auto";
        v.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:4px;height:4px;opacity:0;pointer-events:none";
        document.body.appendChild(v);
        v.play().catch(function () {});
        petVids[file] = v;
      }
      return petVids[file];
    }
    getVid(SHAPES[0]); getVid(SHAPES[1]);   /* 预载两个姿态 */

    function vidReady() {
      var v = getVid(SHAPES[shapeIdx]);
      return v.readyState >= 2 && v.videoWidth > 0;
    }

    function sample() {
      try {
        var v = getVid(SHAPES[shapeIdx]);
        var vw = v.videoWidth, vh = v.videoHeight;
        /* 1) 原生尺寸找角色包围盒（淡出帧返回空盒 → 跳过） */
        var tmp = document.createElement("canvas");
        tmp.width = vw; tmp.height = vh;
        var tc = tmp.getContext("2d");
        tc.drawImage(v, 0, 0);
        var td = tc.getImageData(0, 0, vw, vh).data;
        var cx0 = vw, cy0 = vh, cx1 = 0, cy1 = 0;
        for (var y = 0; y < vh; y += 2)
          for (var x = 0; x < vw; x += 2) {
            if (td[(y * vw + x) * 4 + 3] > 110) {
              if (x < cx0) cx0 = x; if (x > cx1) cx1 = x;
              if (y < cy0) cy0 = y; if (y > cy1) cy1 = y;
            }
          }
        cx0 = Math.max(0, cx0 - 8); cy0 = Math.max(0, cy0 - 8);
        cx1 = Math.min(vw, cx1 + 8); cy1 = Math.min(vh, cy1 + 8);
        var cw = cx1 - cx0, ch = cy1 - cy0;
        if (cw < 24 || ch < 24) {
          /* 淡出帧：0.5s 后重试采样，直到抓到可见帧 */
          if ((window.__smpRetry || 0) < 10) {
            window.__smpRetry = (window.__smpRetry || 0) + 1;
            setTimeout(function () { sample(); }, 500);
          }
          return;
        }
        window.__smpRetry = 0;
        /* 2) 角色区域放大铺满画布 */
        var box = Math.min(W * 0.92, H * 0.92);
        var sc = box / Math.max(cw, ch);
        var w = cw * sc, h = ch * sc;
        var off = document.createElement("canvas");
        off.width = W; off.height = H;
        var c = off.getContext("2d");
        c.drawImage(tmp, cx0, cy0, cw, ch, W / 2 - w / 2, H / 2 - h / 2, w, h);
        var data = c.getImageData(0, 0, W, H).data;
        var gap = W < 640 ? 6 : 4;
        targets = [];
        for (var yy = 0; yy < H; yy += gap)
          for (var xx = 0; xx < W; xx += gap) {
            var i4 = (yy * W + xx) * 4;
            if (data[i4 + 3] > 110) {
              targets.push({
                x: xx, y: yy,
                col: data[i4] + "," + data[i4 + 1] + "," + data[i4 + 2]
              });
            }
          }
        var cap = W < 640 ? 700 : 1400;
        if (targets.length > cap) {
          var keep = [], stp = targets.length / cap;
          for (var k = 0; k < cap; k++) keep.push(targets[(k * stp) | 0]);
          targets = keep;
        }
        while (parts.length > targets.length) parts.pop();
        while (parts.length < targets.length) {
          parts.push({
            x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0,
            col: null,
            s: 2.2 + Math.random() * 1.8, a: 0.7 + Math.random() * 0.3,
            dl: Math.random() * 0.5
          });
        }
        for (var q = 0; q < parts.length; q++) {
          if (targets[q]) parts[q].col = targets[q].col;   /* 粒子提前记住本尊的颜色 */
        }
        window.__smpOK = true;
      } catch (e) { window.__smpErr = (e.message || "?"); }
    }

    function fit() {
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      W = host.clientWidth; H = host.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sample();
    }

    host.addEventListener("pointermove", function (e) {
      var r = host.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    }, { passive: true });
    host.addEventListener("pointerleave", function () { mouse.x = -9999; mouse.y = -9999; });
    host.addEventListener("pointerdown", function (e) {
      var r = host.getBoundingClientRect();
      var bx = e.clientX - r.left, by = e.clientY - r.top;
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        var dx = p.x - bx, dy = p.y - by, d = Math.hypot(dx, dy) || 1;
        var f = Math.min(26, 900 / d);
        p.vx += (dx / d) * f; p.vy += (dy / d) * f;
      }
    });

    var last = performance.now();
    function frame(now) {
      window.__fr = { now: Math.round(now), morphT: Math.round(morphT), vidR: (function () { try { return getVid(SHAPES[shapeIdx]).readyState; } catch (e) { return "err"; } }()) };
      var dt = Math.min(0.05, (now - last) / 1000) || 0.016;
      last = now;
      ctx.clearRect(0, 0, W, H);
      var t = now / 1000;
      /* 全息暗晕：给浅色粒子垫对比度 */
      if (targets && targets.length) {
        var gx = W / 2, gy = H / 2;
        var grd = ctx.createRadialGradient(gx, gy, 10, gx, gy, Math.max(W, H) * 0.36);
        grd.addColorStop(0, "rgba(8, 14, 30, 0.5)");
        grd.addColorStop(1, "rgba(8, 14, 30, 0)");
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, W, H);
      }
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i], tg = targets[i];
        if (tg) {
          var ax = (tg.x - p.x) * 8, ay = (tg.y - p.y) * 8;
          var dx = p.x - mouse.x, dy = p.y - mouse.y;
          var d2 = dx * dx + dy * dy;
          if (d2 < 10000) {
            var d = Math.sqrt(d2) || 1;
            var f = ((100 - d) / 100) * 950;
            ax += (dx / d) * f; ay += (dy / d) * f;
          }
          p.vx = (p.vx + ax * dt) * 0.9;
          p.vy = (p.vy + ay * dt) * 0.9;
          p.x += p.vx * dt; p.y += p.vy * dt;
        }
        var ox = Math.sin(t * 1.4 + i) * 1.1, oy = Math.cos(t * 1.1 + i * 0.7) * 1.1;
        ctx.globalAlpha = p.a;
        ctx.fillStyle = p.col ? "rgb(" + p.col + ")" : "rgb(" + (window.__themeRGB ? window.__themeRGB()[0] : "91,140,255") + ")";
        ctx.fillRect(p.x + ox, p.y + oy, p.s, p.s);
      }
      ctx.globalAlpha = 1;
      /* 姿态轮换：9s 换一次采样 */
      if (now - morphT > 9000 && vidReady()) {
        morphT = now;
        shapeIdx = (shapeIdx + 1) % SHAPES.length;
        sample();
      }
    }

    document.addEventListener("visibilitychange", function () {
      hidden = document.hidden;
      if (!hidden) last = performance.now();
    });
    addEventListener("resize", function () {
      if (vidReady()) fit();
    });

    window.__dbg = function () {
      var cv = document.getElementById("particleHero");
      return { mode: "run", W: W, H: H, segs: parts.length, tg: targets ? targets.length : -1,
               canvasW: cv ? cv.width : -1, canvasH: cv ? cv.height : -1,
               styleW: cv ? cv.style.width : "-", hostW: host ? host.clientWidth : -1, hostH: host ? host.clientHeight : -1 };
    };
    fit();
    if (calm) {
      /* 减弱动效：聚成看板娘静帧 */
      var waitT = setInterval(function () {
        if (vidReady()) {
          clearInterval(waitT);
          sample();
          for (var i = 0; i < parts.length; i++) {
            if (targets[i]) { parts[i].x = targets[i].x; parts[i].y = targets[i].y; }
          }
          frame(performance.now());
        }
      }, 400);
      return;
    }
    setInterval(function () { frame(performance.now()); }, 30);
    window.__dbg = function () { return { smpOK: window.__smpOK || false, smpErr: window.__smpErr || "none", retry: window.__smpRetry || 0, segs: parts.length, tg: targets ? targets.length : -1, W: W, H: H }; };
  }
  try {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  } catch (e) { window.__morphErr = (e.message || "?"); }
})();

/* ═══ 05 导航卡：3D 倾斜跟随 + 光斑 ═══ */
(function () {
  function init() {
    if (!window.matchMedia || !matchMedia("(pointer: fine)").matches) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.querySelectorAll(".page-card").forEach(function (card) {
      if (card.dataset.tilt) return;
      card.dataset.tilt = "1";
      card.classList.add("tilt");
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        card.style.transform =
          "perspective(900px) rotateX(" + ((0.5 - py) * 10).toFixed(2) +
          "deg) rotateY(" + ((px - 0.5) * 12).toFixed(2) + "deg) translateY(-15px) scale(1.03)";
        card.style.setProperty("--gx", (px * 100).toFixed(1) + "%");
        card.style.setProperty("--gy", (py * 100).toFixed(1) + "%");
      }, { passive: true });
      card.addEventListener("pointerleave", function () {
        card.style.transform = "";
      });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
