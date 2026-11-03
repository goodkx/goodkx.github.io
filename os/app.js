/* ═══════════════════════════════════════════════════════════
   CCCAD-OS · 窗口管理
   应用 = 现有页面，窗口内用 iframe 承载（同源可注入样式）
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var APPS = [
    { id: "blog", name: "写作", glyph: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16M4 10h16M4 15h10M4 20h7"/></svg>', url: "../blog.html" },
    { id: "gallery", name: "相册", glyph: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="M3 17l6-5 5 4 4-3 3 3"/></svg>', url: "../gallery.html" },
    { id: "tools", name: "工具箱", glyph: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 6.5a4 4 0 0 0-5 5L3 18l3 3 6.5-6.5a4 4 0 0 0 5-5z"/><path d="M13 3l8 8"/></svg>', url: "../tools.html" },
    { id: "arcade", name: "街机厅", glyph: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="7" width="20" height="11" rx="4"/><path d="M7 11v4M5 13h4"/><circle cx="16" cy="11" r="1"/><circle cx="18.5" cy="13.5" r="1"/></svg>', url: "../arcade.html" },
    { id: "live", name: "人生指南", glyph: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 6c-2-1.5-5-1.5-8 0v12c3-1.5 6-1.5 8 0 2-1.5 5-1.5 8 0V6c-3-1.5-6-1.5-8 0z"/><path d="M12 6v12"/></svg>', url: "../live.html" },
    { id: "ai", name: "AI 军火库", glyph: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M18.5 15.5l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9z"/></svg>', url: "../ai.html" },
    { id: "kaoyan", name: "考研大纲", glyph: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 9l10-4 10 4-10 4z"/><path d="M6 11v5c0 2 3 3 6 3s6-1 6-3v-5"/></svg>', url: "../kaoyan.html" },
    { id: "guestbook", name: "留言板", glyph: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/></svg>', url: "../guestbook.html" },
    { id: "shop", name: "小卖部", glyph: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 8h14l-1 12H6z"/><path d="M9 8a3 3 0 0 1 6 0"/></svg>', url: "../shop.html" },
    { id: "achievements", name: "成就柜", glyph: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="9" r="5"/><path d="M8 13l-2 8 6-3 6 3-2-8"/></svg>', url: "../achievements.html" },
    { id: "report", name: "我的年报", glyph: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>', url: "../report.html" },
    { id: "links", name: "友链", glyph: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1.5 1.5"/><path d="M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6L12.5 17.5"/></svg>', url: "../links.html" },
    { id: "pelican", name: "鹈鹕彩蛋", glyph: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="17" r="3.5"/><circle cx="18" cy="17" r="3.5"/><path d="M6 17l4-8h4l4 8M9 5h5l1 4"/></svg>', url: "../pelican.html" },
    { id: "home", name: "旧版首页", glyph: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>', url: "../index.html" }
  ];

  var iconsEl = document.getElementById("icons");
  var launcher = document.getElementById("launcher");
  var winLayer = document.getElementById("winLayer");
  var dock = document.getElementById("dock");
  var winCount = document.getElementById("winCount");

  var wins = {};        /* id → { el, frame, min } */
  var zTop = 100;
  var openSeq = 0;

  /* ── 图标与开始菜单 ── */
  iconsEl.innerHTML = APPS.map(function (a) {
    return '<button class="app-icon" data-app="' + a.id + '" type="button">' +
      '<span class="glyph">' + a.glyph + "</span>" +
      '<span class="name">' + a.name + "</span>" +
      "</button>";
  }).join("");

  launcher.innerHTML = APPS.map(function (a) {
    return '<button class="launcher-item" data-app="' + a.id + '" type="button">' +
      '<span class="glyph">' + a.glyph + "</span><span>" + a.name + "</span></button>";
  }).join("") +
    '<div class="launcher-sep"></div>' +
    '<a class="launcher-item" href="../index.html"><span class="glyph">↩</span><span>返回旧版首页</span></a>';

  function findApp(id) {
    for (var i = 0; i < APPS.length; i++) if (APPS[i].id === id) return APPS[i];
    return null;
  }

  /* ── 打开应用 ── */
  function openApp(id) {
    var app = findApp(id);
    if (!app) return;
    if (wins[id]) { focusWin(id); restoreWin(id); return; }

    var isMobile = window.matchMedia("(max-width: 734px)").matches;
    if (isMobile) { window.location.href = app.url; return; }

    var w = 720, h = 520;
    var maxW = window.innerWidth - 80, maxH = window.innerHeight - 120;
    w = Math.min(w, maxW); h = Math.min(h, maxH);
    var off = (openSeq++ % 6) * 26;
    var x = Math.max(24, (window.innerWidth - w) / 2 - 80 + off);
    var y = Math.max(60, (window.innerHeight - h) / 2 - 40 + off);

    var el = document.createElement("div");
    el.className = "win";
    el.style.left = x + "px";
    el.style.top = y + "px";
    el.style.width = w + "px";
    el.style.height = h + "px";
    el.innerHTML =
      '<div class="win-bar">' +
        '<span class="win-dots">' +
          '<button class="win-dot close" aria-label="关闭"></button>' +
          '<button class="win-dot min" aria-label="最小化"></button>' +
          '<button class="win-dot max" aria-label="最大化"></button>' +
        "</span>" +
        '<span class="win-title">' + app.name + " — " + app.url.replace("../", "") + "</span>" +
      "</div>" +
      '<div class="win-body"><iframe title="' + app.name + '" src="' + app.url + '" loading="lazy"></iframe>' +
        '<span class="win-grip" aria-hidden="true"></span></div>';

    winLayer.appendChild(el);

    var frame = el.querySelector("iframe");
    frame.addEventListener("load", function () {
      try {
        var d = frame.contentDocument;
        if (!d || !d.head) return;
        var s = d.createElement("style");
        s.textContent =
          ".nav,.footer,.site-footer,.progress,.back-top,.hud-c,.hud-ro,.hud-scan,#petWrap,#webPet{display:none!important}" +
          "body{padding-top:0!important}" +
          ".section{padding-block:44px!important}" +
          "html{scroll-behavior:auto}";
        d.head.appendChild(s);
      } catch (e) {}
    });

    wins[id] = { el: el, frame: frame, min: false };
    focusWin(id);
    bindWin(id);
    syncDock();
  }

  /* ── 窗口交互 ── */
  function bindWin(id) {
    var w = wins[id], el = w.el;
    var bar = el.querySelector(".win-bar");

    /* 关闭 */
    el.querySelector(".win-dot.close").addEventListener("click", function () {
      el.remove();
      delete wins[id];
      syncDock();
    });
    /* 最小化 */
    el.querySelector(".win-dot.min").addEventListener("click", function () {
      el.classList.add("is-min");
      w.min = true;
      syncDock();
    });
    /* 最大化 / 还原 */
    el.querySelector(".win-dot.max").addEventListener("click", function () {
      if (el.dataset.max === "1") {
        el.dataset.max = "";
        el.style.left = w.prev.x; el.style.top = w.prev.y;
        el.style.width = w.prev.w; el.style.height = w.prev.h;
      } else {
        w.prev = { x: el.style.left, y: el.style.top, w: el.style.width, h: el.style.height };
        el.dataset.max = "1";
        el.style.left = "12px";
        el.style.top = "46px";
        el.style.width = (window.innerWidth - 24) + "px";
        el.style.height = (window.innerHeight - 78) + "px";
      }
      focusWin(id);
    });

    /* 拖拽 */
    var drag = null;
    bar.addEventListener("pointerdown", function (e) {
      if (e.target.closest(".win-dot")) return;
      focusWin(id);
      drag = { x: e.clientX, y: e.clientY, l: el.offsetLeft, t: el.offsetTop };
      bar.setPointerCapture(e.pointerId);
    });
    bar.addEventListener("pointermove", function (e) {
      if (!drag) return;
      el.style.left = Math.max(-el.offsetWidth + 80, drag.l + e.clientX - drag.x) + "px";
      el.style.top = Math.max(0, drag.t + e.clientY - drag.y) + "px";
    });
    bar.addEventListener("pointerup", function () { drag = null; });

    /* 缩放 */
    var grip = el.querySelector(".win-grip");
    var rs = null;
    grip.addEventListener("pointerdown", function (e) {
      e.stopPropagation();
      focusWin(id);
      rs = { x: e.clientX, y: e.clientY, w: el.offsetWidth, h: el.offsetHeight };
      grip.setPointerCapture(e.pointerId);
    });
    grip.addEventListener("pointermove", function (e) {
      if (!rs) return;
      el.style.width = Math.max(320, rs.w + e.clientX - rs.x) + "px";
      el.style.height = Math.max(220, rs.h + e.clientY - rs.y) + "px";
    });
    grip.addEventListener("pointerup", function () { rs = null; });

    el.addEventListener("pointerdown", function () { focusWin(id); });
  }

  function focusWin(id) {
    var w = wins[id];
    if (!w) return;
    Object.keys(wins).forEach(function (k) { wins[k].el.classList.remove("focused"); });
    w.el.classList.add("focused");
    w.el.style.zIndex = String(++zTop);
  }

  function restoreWin(id) {
    var w = wins[id];
    if (!w) return;
    if (w.min) { w.min = false; w.el.classList.remove("is-min"); }
    syncDock();
  }

  /* ── 任务栏 ── */
  function syncDock() {
    var ids = Object.keys(wins);
    dock.innerHTML = ids.map(function (id) {
      var app = findApp(id);
      var active = wins[id].el.classList.contains("focused") ? " active" : "";
      return '<button class="dock-item' + active + '" data-app="' + id + '" type="button">' +
        '<span class="glyph">' + app.glyph + "</span>" + app.name + "</button>";
    }).join("");
    dock.classList.toggle("empty", ids.length === 0);
    winCount.textContent = ids.length + " 个窗口";
  }

  dock.addEventListener("click", function (e) {
    var b = e.target.closest(".dock-item");
    if (!b) return;
    var id = b.getAttribute("data-app");
    restoreWin(id);
    focusWin(id);
    syncDock();
  });

  /* ── 开始菜单 ── */
  var launchBtn = document.getElementById("launchBtn");
  launchBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    var open = launcher.classList.toggle("open");
    launchBtn.setAttribute("aria-expanded", String(open));
  });
  launcher.addEventListener("click", function (e) {
    var b = e.target.closest("[data-app]");
    if (!b) return;
    launcher.classList.remove("open");
    launchBtn.setAttribute("aria-expanded", "false");
    openApp(b.getAttribute("data-app"));
  });
  document.addEventListener("click", function (e) {
    if (!launcher.contains(e.target) && e.target !== launchBtn) {
      launcher.classList.remove("open");
      launchBtn.setAttribute("aria-expanded", "false");
    }
  });

  /* ── 图标 ── */
  function bindIcons() {
    iconsEl.addEventListener("dblclick", function (e) {
      var b = e.target.closest(".app-icon");
      if (b) openApp(b.getAttribute("data-app"));
    });
    /* 触屏/慢速双击：单击两次也认 */
    var lastTap = { id: null, t: 0 };
    iconsEl.addEventListener("click", function (e) {
      var b = e.target.closest(".app-icon");
      if (!b) return;
      var id = b.getAttribute("data-app");
      var now = Date.now();
      if (lastTap.id === id && now - lastTap.t < 420) {
        openApp(id);
        lastTap = { id: null, t: 0 };
      } else {
        lastTap = { id: id, t: now };
      }
    });
  }
  bindIcons();

  /* ── 关闭全部 ── */
  document.getElementById("closeAllBtn").addEventListener("click", function () {
    Object.keys(wins).forEach(function (id) { wins[id].el.remove(); delete wins[id]; });
    syncDock();
  });

  /* ── 时钟 ── */
  function tick() {
    var d = new Date();
    var p = function (n) { return n < 10 ? "0" + n : String(n); };
    var hm = p(d.getHours()) + ":" + p(d.getMinutes());
    document.getElementById("clock").textContent = hm;
    var b = document.getElementById("bigClock");
    if (b) b.textContent = hm;
    var bd = document.getElementById("bigDate");
    if (bd) bd.textContent = (d.getMonth() + 1) + " 月 " + d.getDate() + " 日 · " + ["日","一","二","三","四","五","六"][d.getDay()];
  }
  tick();
  setInterval(tick, 15000);

  /* ── 主题 ── */
  function setTheme(t) {
    if (t) document.documentElement.setAttribute("data-theme", t);
    else document.documentElement.removeAttribute("data-theme");
    try { localStorage.setItem("os-theme", t); } catch (e) {}
  }
  try { setTheme(localStorage.getItem("os-theme") || ""); } catch (e) {}
  document.querySelectorAll(".theme-dot").forEach(function (b) {
    b.addEventListener("click", function () { setTheme(b.getAttribute("data-t")); });
  });

  /* ── 桌面空白处点击：失焦 ── */
  document.getElementById("desktop").addEventListener("pointerdown", function (e) {
    if (e.target.closest(".win") || e.target.closest(".app-icon") || e.target.closest(".menubar")) return;
    Object.keys(wins).forEach(function (k) { wins[k].el.classList.remove("focused"); });
    syncDock();
  });

  /* 首次进入：自动开一个「写作」窗口，给个开场 */
  if (!window.matchMedia("(max-width: 734px)").matches) {
    setTimeout(function () { openApp("blog"); }, 380);
  }
})();