/* ═══════════════════════════════════════════════════════════
   interactions.js · 纸面交互
   光标暖光 / 卡片聚光 / 点击墨迹
   仅在桌面精确指针 + 未开启减弱动效时启用
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia && matchMedia("(pointer: fine)").matches;
  if (reduce || !fine) return;

  /* ── 光标暖光：纸面被灯照到的感觉 ── */
  var glow = document.createElement("div");
  glow.className = "cursor-glow";
  glow.setAttribute("aria-hidden", "true");
  document.body.appendChild(glow);

  var tx = window.innerWidth / 2, ty = window.innerHeight / 3;
  var cx = tx, cy = ty, raf = 0;

  function tick() {
    cx += (tx - cx) * 0.1;
    cy += (ty - cy) * 0.1;
    glow.style.transform = "translate3d(" + cx + "px," + cy + "px,0)";
    if (Math.abs(tx - cx) > 0.4 || Math.abs(ty - cy) > 0.4) {
      raf = requestAnimationFrame(tick);
    } else {
      raf = 0;
    }
  }

  window.addEventListener("mousemove", function (e) {
    tx = e.clientX;
    ty = e.clientY;
    if (!raf) raf = requestAnimationFrame(tick);
  }, { passive: true });

  window.addEventListener("mouseleave", function () {
    glow.style.opacity = "0";
  });
  window.addEventListener("mouseenter", function () {
    glow.style.opacity = "";
  });

  /* ── 卡片聚光：光点跟着鼠标在卡面上走 ── */
  var CARD = ".page-card, .feat-card, .post-item, .az-item, .mini-shop, .contact-box, .bento-card, .tool-card";
  var lastCard = null;

  document.addEventListener("mousemove", function (e) {
    var card = e.target.closest && e.target.closest(CARD);
    if (lastCard && lastCard !== card) {
      lastCard.style.removeProperty("--mx");
      lastCard.style.removeProperty("--my");
      lastCard = null;
    }
    if (!card) return;
    var r = card.getBoundingClientRect();
    card.style.setProperty("--mx", (e.clientX - r.left) + "px");
    card.style.setProperty("--my", (e.clientY - r.top) + "px");
    lastCard = card;
  }, { passive: true });

  /* ── 点击墨迹：从按下的位置扩散一圈赭红 ── */
  document.addEventListener("pointerdown", function (e) {
    if (e.button !== 0) return;
    var target = e.target.closest && e.target.closest("a, button, .btn, .page-card, .nav-links a, .tool-chip");
    if (!target) return;
    if (getComputedStyle(target).position === "static") target.style.position = "relative";

    var r = target.getBoundingClientRect();
    var d = Math.max(r.width, r.height) * 1.35;
    var ink = document.createElement("span");
    ink.className = "ink-ripple";
    ink.style.width = d + "px";
    ink.style.height = d + "px";
    ink.style.left = (e.clientX - r.left - d / 2) + "px";
    ink.style.top = (e.clientY - r.top - d / 2) + "px";
    target.appendChild(ink);
    setTimeout(function () { ink.remove(); }, 620);
  }, { passive: true });

  /* ── 滚动时轻微推进进度条（若页面有 .progress） ── */
  var bar = document.getElementById("progress");
  if (bar) {
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        var p = h > 0 ? Math.min(1, window.scrollY / h) : 0;
        bar.style.transform = "scaleX(" + p + ")";
        bar.style.transformOrigin = "0 50%";
        ticking = false;
      });
    }, { passive: true });
  }
})();