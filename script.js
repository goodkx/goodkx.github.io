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
  { type: "out", text: "你的名字 —— 一个热爱创造的人" },
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
const roles = ["开发者", "设计爱好者", "终身学习者", "问题解决者"];

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

/* ─────────── 启动 ─────────── */
document.addEventListener("DOMContentLoaded", () => {
  initReveal();
  initNav();
  initCopyEmail();
  initPageCards();
  initCursorGlow();
  initYear();
  setTimeout(() => {
    runTerminal();
    typeRoles();
  }, 500);
});
