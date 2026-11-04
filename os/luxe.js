/* ═══════════════════════════════════════════════════════════════════════════
   CCCAD · 典藏版 — 只做增强，不承载内容
   页面所有文字与链接都是静态 HTML；关闭 JS 依然完整可读（html.js 由 head 内联添加）。
   v270
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var root = document.documentElement;
  var KEY = "cccad-luxe-mode";

  /* ── 明暗配色（独立于主站主题，不写 site-theme） ─────────────────────── */
  var modeBtn = document.getElementById("modeBtn");
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  var MOON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>';
  var SUN = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4"/></svg>';

  function setMode(mode, persist) {
    var dark = mode !== "light";
    root.setAttribute("data-mode", dark ? "dark" : "light");
    if (modeBtn) {
      modeBtn.innerHTML = dark ? MOON : SUN;
      modeBtn.setAttribute("aria-label", dark ? "切换到象牙白配色" : "切换到墨黑配色");
    }
    if (themeMeta) themeMeta.setAttribute("content", dark ? "#0c0d0f" : "#f4f1ea");
    if (persist) {
      try { localStorage.setItem(KEY, dark ? "dark" : "light"); } catch (e) { /* 隐私模式忽略 */ }
    }
  }

  var saved = "dark";
  try { saved = localStorage.getItem(KEY) || "dark"; } catch (e) { /* 隐私模式忽略 */ }
  /* 支持 ?mode=light / ?mode=dark 直接分享某一版，不改变本地偏好 */
  try {
    var q = new URLSearchParams(location.search).get("mode");
    if (q === "light" || q === "dark") saved = q;
  } catch (e) { /* 老浏览器忽略 */ }
  setMode(saved, false);

  function toggleMode() {
    setMode(root.getAttribute("data-mode") === "dark" ? "light" : "dark", true);
  }
  if (modeBtn) modeBtn.addEventListener("click", toggleMode);
  document.addEventListener("keydown", function (e) {
    if (e.key !== "m" && e.key !== "M") return;
    var t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    toggleMode();
  });

  /* ── 本地时钟 ────────────────────────────────────────────────────────── */
  var clock = document.getElementById("clock");
  function tick() {
    if (!clock) return;
    var d = new Date();
    clock.textContent = ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
  }
  tick();
  setInterval(tick, 30000);

  /* ── 滚动进度 + 顶栏收拢 ────────────────────────────────────────────── */
  var bar = document.getElementById("progress");
  var topbar = document.getElementById("topbar");
  var queued = false;

  function onScroll() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var pct = max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0;
      if (bar) bar.style.width = pct + "%";
      if (topbar) topbar.classList.toggle("is-stuck", window.scrollY > 24);
      queued = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  onScroll();

  /* ── 入场显现 ─────────────────────────────────────────────────────────
     首屏内容不依赖 IntersectionObserver：IO 回调在慢设备 / iframe / 无头
     渲染里可能迟迟不到，会让首屏整片空白。这里先直接点亮首屏，
     IO 只负责后续滚动进入的区块，另加一道定时兜底。               */
  var items = Array.prototype.slice.call(document.querySelectorAll(".reveal"));

  function inFirstScreen(el) {
    return el.getBoundingClientRect().top < window.innerHeight * 1.05;
  }
  function lightUp(el, instant) {
    el.classList.add("in");
    if (instant) el.classList.add("instant");
  }

  /* 首屏：瞬时可见，不做淡入，保证任何渲染环境下都不白屏 */
  items.forEach(function (el) { if (inFirstScreen(el)) lightUp(el, true); });

  if (!("IntersectionObserver" in window)) {
    items.forEach(function (el) { lightUp(el, true); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        lightUp(en.target);
        io.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px 8% 0px", threshold: 0 });
    items.forEach(function (el) { if (!el.classList.contains("in")) io.observe(el); });
  }

  setTimeout(function () {
    items.forEach(function (el) {
      if (!el.classList.contains("in") && inFirstScreen(el)) lightUp(el, true);
    });
  }, 1500);
})();
