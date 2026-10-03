/* ─────────── 🏆 小站全站游戏排名（textdb 云端共享） ───────────
   各游戏页面引入本文件后：
   LB.render(game, mountSel, unit)        渲染 TOP 10 榜单
   LB.submit(game, name, score) → {rank}  提交成绩并返回名次
   game 取值：snake / g2048 / memory（memory 按步数升序，其余按分数降序） */
(function () {
  const KEYS = {
    snake: "cccad-lb-snake",
    g2048: "cccad-lb-2048",
    memory: "cccad-lb-memory",
  };
  const BASE = "https://textdb.dev/api/data/";
  const CAP = 10;

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  async function fetchLb(game) {
    const r = await fetch(BASE + KEYS[game] + "?p=" + Math.random(), { cache: "no-store" });
    if (r.status === 404) return []; /* 榜单尚不存在 → 空榜 */
    if (!r.ok) throw new Error("HTTP " + r.status);
    const d = await r.json();
    return Array.isArray(d.list) ? d.list : [];
  }

  async function putLb(game, list) {
    const r = await fetch(BASE + KEYS[game], {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ list }),
    });
    if (!r.ok) throw new Error("HTTP " + r.status);
  }

  function better(a, b, game) {
    return game === "memory" ? a.s < b.s : a.s > b.s;
  }

  window.LB = {
    fetchLb,

    /* 提交成绩：返回 {rank, list}；失败抛错 */
    async submit(game, name, score) {
      const list = await fetchLb(game);
      const entry = {
        n: (String(name || "").trim().slice(0, 10) || "匿名选手"),
        s: Number(score) || 0,
        d: new Date().toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }),
      };
      list.push(entry);
      list.sort((a, b) => (better(a, b, game) ? -1 : better(b, a, game) ? 1 : 0));
      const top = list.slice(0, 10);
      await putLb(game, top);
      const rank = top.indexOf(entry);
      return { rank: (rank === -1 ? CAP : rank) + 1, list: top, entry };
    },

    /* 渲染 TOP 10（unit：分数单位文案） */
    render(game, mountSel, unit) {
      const mount = document.querySelector(mountSel);
      if (!mount) return;
      mount.innerHTML = '<p class="lb-head">🏆 全站排名加载中…</p>';
      window.LB.fetchLb(game)
        .then((list) => {
          mount.innerHTML = list.length
            ? '<p class="lb-head">🏆 全站排名 TOP ' + list.length + "</p>" +
              list.map((x, i) =>
                '<div class="lb-row' + (i === 0 ? " first" : "") + '">' +
                '<span class="rk">' + (i + 1) + "</span>" +
                '<span class="nm">' + esc(x.n) + "</span>" +
                '<span class="sc">' + x.s + (unit ? " " + unit : "") + "</span>" +
                '<span class="dt">' + esc(x.d || "") + "</span></div>"
              ).join("")
            : '<p class="lb-head">🏆 榜单虚位以待 —— 成为第一个上榜的人！</p>';
        })
        .catch(() => {
          mount.innerHTML = '<p class="lb-head">排名暂时无法加载（网络原因）</p>';
        });
    },

    /* 读取本机曾用昵称 / 保存 */
    getName() {
      try { return localStorage.getItem("lb-name") || ""; } catch (e) { return ""; }
    },
    saveName(n) {
      try { localStorage.setItem("lb-name", n); } catch (e) {}
    },
  };
})();
