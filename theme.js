/* ═══════ 全站主题切换器 ═══════
   在 <head> 里引入：theme.css（样式）+ 本文件。
   尽早把已保存的主题写到 <html data-theme>，避免页面闪色。 */

(function () {
  const KEY = "site-theme";
  const THEMES = [
    { id: "",       name: "深空绿 · 默认" },
    { id: "violet", name: "紫夜" },
    { id: "paper",  name: "暖纸 · 日间" },
    { id: "amber",  name: "墨金 · OLED" },
  ];

  // 解析到本脚本时立即应用（此时正文尚未渲染）
  let saved = "";
  try { saved = localStorage.getItem(KEY) || ""; } catch (e) {}
  if (saved) document.documentElement.dataset.theme = saved;

  function apply(id) {
    if (id) document.documentElement.dataset.theme = id;
    else delete document.documentElement.dataset.theme;
    try { localStorage.setItem(KEY, id); } catch (e) {}
    document.querySelectorAll("#themePop button").forEach((b) => {
      b.classList.toggle("on", b.dataset.t === id);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.createElement("button");
    btn.id = "themeBtn";
    btn.type = "button";
    btn.title = "切换主题风格";
    btn.setAttribute("aria-label", "切换主题风格");
    btn.textContent = "🎨";

    const pop = document.createElement("div");
    pop.id = "themePop";
    pop.innerHTML = THEMES.map(
      (t) =>
        `<button type="button" data-t="${t.id}"><span class="sw" data-c="${t.id}"></span>${t.name}</button>`
    ).join("");

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      pop.classList.toggle("open");
    });

    pop.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-t]");
      if (!b) return;
      apply(b.dataset.t);
      pop.classList.remove("open");
    });

    document.addEventListener("click", (e) => {
      if (!pop.contains(e.target) && e.target !== btn) pop.classList.remove("open");
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") pop.classList.remove("open");
    });

    document.body.appendChild(pop);
    document.body.appendChild(btn);

    const cur = document.documentElement.dataset.theme || "";
    pop.querySelectorAll("button[data-t]").forEach((b) => {
      b.classList.toggle("on", b.dataset.t === cur);
    });
  });
})();
