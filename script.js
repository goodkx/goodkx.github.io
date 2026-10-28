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

/* ─────────── 导航：高亮 + 移动端菜单 + 进度条 ─────────── */
function initNav() {
  const links = $("#navLinks");
  const toggle = $("#navToggle");

  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      toggle.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
    });
    // 点击链接后收起菜单
    $$(".nav-links a").forEach((a) =>
      a.addEventListener("click", () => {
        links.classList.remove("open");
        toggle.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      })
    );
  }

  const sections = $$("main section[id]");
  const progress = $("#progress");
  const navLinks = $$(".nav-links a");

  const onScroll = () => {
    const y = window.scrollY + 130;
    let current = "";
    sections.forEach((s) => {
      if (s.offsetTop <= y) current = s.id;
    });
    navLinks.forEach((a) =>
      a.classList.toggle("active", a.getAttribute("href") === "#" + current)
    );
    if (progress) {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      progress.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
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

/* ═══ 粒子聚形 Hero：上千粒子拼字，鼠标排斥回流，点击爆发重组 ═══ */
(function () {
  function init() {
    var hero = document.getElementById("hero");
    if (!hero || hero.dataset.particles) return;
    if (!window.matchMedia || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    hero.dataset.particles = "1";
    var canvas = document.createElement("canvas");
    canvas.id = "particleHero";
    canvas.setAttribute("aria-hidden", "true");
    hero.prepend(canvas);
    var ctx = canvas.getContext("2d");
    var COLORS = ["0,229,160", "0,229,160", "0,229,160", "56,189,248"];
    var SHAPES = ["CCCAD", "</>"];
    var shapeIdx = 0, W = 0, H = 0, parts = [], targets = [];
    var raf = 0, morphT = 0, hidden = false, last = 0;
    var mouse = { x: -9999, y: -9999 };

    function sample() {
      var off = document.createElement("canvas");
      off.width = W; off.height = H;
      var c = off.getContext("2d");
      var fs = Math.min(W * 0.16, H * 0.34);
      c.font = "900 " + fs.toFixed(0) + "px ui-monospace, Consolas, monospace";
      c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText(SHAPES[shapeIdx], W / 2, H * 0.34);
      var data = c.getImageData(0, 0, W, H).data;
      var gap = W < 640 ? 7 : 5;
      targets = [];
      for (var y = 0; y < H; y += gap)
        for (var x = 0; x < W; x += gap)
          if (data[(y * W + x) * 4 + 3] > 128) targets.push({ x: x, y: y });
      var tx0=1e9,ty0=1e9,tx1=-1,ty1=-1;
      var cap = W < 640 ? 1200 : 2400;
      if (targets.length > cap) {
        var keep = [], step = targets.length / cap;
        for (var k = 0; k < cap; k++) keep.push(targets[(k * step) | 0]);
        targets = keep;
      }
      for (var q = 0; q < targets.length; q++) { var tp = targets[q]; if (tp.x < tx0) tx0 = tp.x; if (tp.x > tx1) tx1 = tp.x; if (tp.y < ty0) ty0 = tp.y; if (tp.y > ty1) ty1 = tp.y; }
      window.__phero = { n: targets.length, fs: fs, bounds: [tx0, ty0, tx1, ty1], W: W, H: H, word: SHAPES[shapeIdx] };
      while (parts.length > targets.length) parts.pop();
      while (parts.length < targets.length) {
        parts.push({
          x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0,
          c: COLORS[(Math.random() * COLORS.length) | 0],
          s: 0.9 + Math.random() * 1.4, a: 0.4 + Math.random() * 0.55
        });
      }
    }
    function fit() {
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      W = hero.clientWidth; H = hero.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sample();
    }
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    }, { passive: true });
    hero.addEventListener("pointerleave", function () { mouse.x = -9999; mouse.y = -9999; });
    hero.addEventListener("pointerdown", function (e) {
      var r = hero.getBoundingClientRect();
      var bx = e.clientX - r.left, by = e.clientY - r.top;
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        var dx = p.x - bx, dy = p.y - by, d = Math.hypot(dx, dy) || 1;
        var f = Math.min(30, 1100 / d);
        p.vx += (dx / d) * f; p.vy += (dy / d) * f;
      }
    });
    function frame(now) {
      if (hidden) return;
      var dt = Math.min(0.05, (now - last) / 1000) || 0.016;
      last = now;
      ctx.clearRect(0, 0, W, H);
      var t = now / 1000;
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i], tg = targets[i];
        var ax = (tg.x - p.x) * 9, ay = (tg.y - p.y) * 9;
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
        var ox = Math.sin(t * 1.4 + i) * 1.1, oy = Math.cos(t * 1.1 + i * 0.7) * 1.1;
        ctx.globalAlpha = p.a;
        ctx.fillStyle = "rgb(" + p.c + ")";
        ctx.fillRect(p.x + ox, p.y + oy, p.s, p.s);
      }
      ctx.globalAlpha = 1;
      if (now - morphT > 9000) {
        morphT = now;
        shapeIdx = (shapeIdx + 1) % SHAPES.length;
        sample();
      }
    }
    document.addEventListener("visibilitychange", function () {
      hidden = document.hidden;
      if (!hidden) last = performance.now();
    });
    addEventListener("resize", fit);
    fit();
    morphT = performance.now();
    /* 本项目实测：内嵌浏览器 rAF 可能不触发（数字雨同款坑），用 setInterval 驱动 */
    setInterval(function () { frame(performance.now()); }, 33);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
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
          "deg) rotateY(" + ((px - 0.5) * 12).toFixed(2) + "deg) translateY(-6px)";
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
