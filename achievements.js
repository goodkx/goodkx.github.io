/* ═══════ 🏅 访客成就系统 ═══════
   纯本地（localStorage），无后端：解锁即弹 toast，成就柜页 achievements.html 展示全柜。
   其他页面通过 window.ACH.unlock(id) 点亮。 */

(function () {
  var KEY = "ach-v1";
  var data = {};
  try { data = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { data = {}; }

  var defs = {
    first:    { icon: "🚪", name: "初来乍到",   desc: "第一次踏进这个数字小站" },
    regular:  { icon: "🌀", name: "回头客",     desc: "隔天又来了——被什么留住了吧" },
    night:    { icon: "🌙", name: "夜猫子",     desc: "在凌晨 0 点到 5 点之间到访" },
    pages:    { icon: "🧭", name: "走遍全站",   desc: "到访过 6 个不同页面" },
    theme:    { icon: "🎨", name: "换装师",     desc: "切换一次主题风格" },
    rain:     { icon: "🌧️", name: "造雨人",     desc: "亲手切换过背景氛围" },
    konami:   { icon: "🎮", name: "秘技发现者", desc: "输入了传说中的上上下下左右左右BA" },
    search:   { icon: "🔍", name: "搜到就是赚到", desc: "用过一次全站搜索" },
    pet:      { icon: "🐋", name: "撸鲸狂魔",   desc: "戳了鲸鲸 10 次" },
    petbye:   { icon: "👋", name: "依依不舍",   desc: "送走鲸鲸又把它叫了回来" },
    gb:       { icon: "✍️", name: "墙头涂鸦",   desc: "在留言墙留下了第一笔" },
    g2048:    { icon: "🔢", name: "合并大师",   desc: "玩完一局 2048" },
    gtetris:  { icon: "🧱", name: "方块建筑师", desc: "玩完一局俄罗斯方块" },
    gmemory:  { icon: "🃏", name: "过目不忘",   desc: "玩完一局记忆翻牌" },
    gmines:   { icon: "💣", name: "排雷专家",   desc: "玩完一局扫雷" },
    gtyping:  { icon: "⌨️", name: "键指如飞",   desc: "打完一场计时赛" }
  };
  var ORDER = ["first", "regular", "night", "pages", "theme", "rain", "konami", "search",
               "pet", "petbye", "gb", "g2048", "gtetris", "gmemory", "gmines", "gtyping"];

  function save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} }

  var toastEl = null, toastT = 0;
  function toast(d) {
    if (!toastEl) {
      var st = document.createElement("style");
      st.id = "achStyle";
      st.textContent =
        "#achToast{position:fixed;right:22px;bottom:200px;z-index:1500;display:flex;gap:12px;align-items:center;" +
        "background:rgba(8,14,12,.95);border:1px solid var(--accent,#00e5a0);border-radius:14px;padding:12px 18px;" +
        "box-shadow:0 10px 30px rgba(0,0,0,.5);opacity:0;transform:translateX(30px);transition:.4s;pointer-events:none}" +
        "#achToast.show{opacity:1;transform:none}" +
        "#achToast .ai{font-size:1.6rem}" +
        "#achToast .at{font-family:var(--mono);font-size:.66rem;color:var(--accent,#00e5a0);letter-spacing:1px}" +
        "#achToast .an{font-weight:700;font-size:.92rem;color:#eafff6}" +
        "@media(max-width:640px){#achToast{right:12px;bottom:150px;max-width:calc(100vw - 24px)}}";
      document.head.appendChild(st);
      toastEl = document.createElement("div");
      toastEl.id = "achToast";
      toastEl.setAttribute("role", "status");
      document.body.appendChild(toastEl);
    }
    toastEl.innerHTML = '<span class="ai">' + d.icon + '</span><span><span class="at">成就解锁 · ACHIEVEMENT</span><br><span class="an">' +
      d.name + '</span></span>';
    toastEl.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove("show"); }, 3400);
  }

  function unlock(id) {
    if (data[id] || !defs[id]) return;
    data[id] = Date.now();
    save();
    try { toast(defs[id]); } catch (e) {}
  }

  window.ACH = {
    unlock: unlock,
    defs: defs,
    order: ORDER,
    count: function () { return Object.keys(data).length; },
    data: function () { return data; }
  };

  /* ── 自动钩子（延到 DOMContentLoaded：toast 需要 body）── */
  function autoHooks() {
  var h = new Date().getHours();
  unlock("first");
  if (h >= 0 && h < 5) unlock("night");
  try {
    var today = new Date().toDateString();
    var last = localStorage.getItem("last-visit-day");
    if (last && last !== today) unlock("regular");
    localStorage.setItem("last-visit-day", today);
  } catch (e) {}
  try {
    var trail = JSON.parse(localStorage.getItem("page-trail") || "[]");
    var path = location.pathname.split("/").pop() || "index.html";
    if (trail.indexOf(path) < 0) { trail.push(path); localStorage.setItem("page-trail", JSON.stringify(trail.slice(-30))); }
    if (trail.length >= 6) unlock("pages");
  } catch (e) {}
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", autoHooks);
  else autoHooks();
})();
