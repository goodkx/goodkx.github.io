/* ═══════════════════════════════════════════════════════════
   CCCAD-OS · 窗口管理
   应用 = 现有页面，窗口内用 iframe 承载（同源可注入样式）
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var APPS = [
    { id: "blog", name: "写作", glyph: "✍️", url: "../blog.html" },
    { id: "gallery", name: "相册", glyph: "🖼️", url: "../gallery.html" },
    { id: "tools", name: "工具箱", glyph: "🧰", url: "../tools.html" },
    { id: "arcade", name: "街机厅", glyph: "🕹️", url: "../arcade.html" },
    { id: "live", name: "人生指南", glyph: "📖", url: "../live.html" },
    { id: "ai", name: "AI 军火库", glyph: "🤖", url: "../ai.html" },
    { id: "kaoyan", name: "考研大纲", glyph: "🎯", url: "../kaoyan.html" },
    { id: "guestbook", name: "留言板", glyph: "💬", url: "../guestbook.html" },
    { id: "shop", name: "小卖部", glyph: "🛒", url: "../shop.html" },
    { id: "achievements", name: "成就柜", glyph: "🏅", url: "../achievements.html" },
    { id: "report", name: "我的年报", glyph: "📊", url: "../report.html" },
    { id: "links", name: "友链", glyph: "🔗", url: "../links.html" },
    { id: "pelican", name: "鹈鹕彩蛋", glyph: "🚲", url: "../pelican.html" },
    { id: "home", name: "旧版首页", glyph: "🏠", url: "../index.html" }
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
    document.getElementById("clock").textContent = p(d.getHours()) + ":" + p(d.getMinutes());
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