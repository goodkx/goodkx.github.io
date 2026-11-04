/* v2 共享：滚动淡入 + 粒子取色（苹果风是浅色底，光晕用白） */
(function () {
  window.__themeRGB = function () { return ["255, 255, 255", "255, 255, 255"]; };

  var items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    for (var i = 0; i < items.length; i++) items[i].classList.add("in");
    return;
  }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  for (var k = 0; k < items.length; k++) io.observe(items[k]);
})();