/* v2 共享脚本：主题切换 + 入场动效 + 粒子取色 */
(function () {
  var KEY = "site-theme-v2";
  var THEMES = [{ id: "", name: "深空" }, { id: "paper", name: "纸白" }, { id: "amber", name: "琥珀" }, { id: "slate", name: "石板" }];
  var root = document.documentElement;
  var nameEl = document.getElementById("themeName");
  var btn = document.getElementById("themeBtn");

  function apply(id) {
    if (id) root.setAttribute("data-theme", id); else root.removeAttribute("data-theme");
    try { localStorage.setItem(KEY, id); } catch (e) {}
    if (nameEl) {
      var t = THEMES.filter(function (x) { return x.id === id; })[0] || THEMES[0];
      nameEl.textContent = t.name;
    }
  }

  var saved = "";
  try { saved = localStorage.getItem(KEY) || ""; } catch (e) {}
  apply(saved);

  if (btn) {
    btn.addEventListener("click", function () {
      var cur = root.getAttribute("data-theme") || "";
      var i = 0;
      for (var k = 0; k < THEMES.length; k++) if (THEMES[k].id === cur) i = k;
      apply(THEMES[(i + 1) % THEMES.length].id);
    });
  }

  window.__themeRGB = function () {
    var cs = getComputedStyle(root);
    var a = (cs.getPropertyValue("--accent-rgb") || "61, 190, 146").trim();
    return [a, a];
  };
})();

(function () {
  var items = document.querySelectorAll(".reveal");
  function show(el) { el.classList.add("in"); }
  if (!("IntersectionObserver" in window)) {
    for (var i = 0; i < items.length; i++) show(items[i]);
    return;
  }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  for (var k = 0; k < items.length; k++) io.observe(items[k]);
})();