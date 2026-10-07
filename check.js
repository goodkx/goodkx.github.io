/* ═════════════════════════════════════════════════════════════
   🔍 小站自检脚本（node check.js）
   部署前跑一遍，抓「改了 A 忘了 B」类的漂移：
   1. 所有页面引用的本地资源文件是否存在（断链检查）
   2. sitemap.xml 里的 URL 是否都有对应文件
   3. 搜索索引(search.js)的目标页面是否存在、博客文章 id 是否真实
   4. 博客 ORDER 与 POSTS 是否一致（两边都注册才可见）
   5. 首页页面导航卡片的目标页面是否存在
   6. 「活数字」漂移：文章数 / 工具数 / 画作数 / 游戏数 的宣称值 vs 实际值
   7. 资源版本号漂移报告（同名资源出现多个版本号 → 提示统一）
   用法：node check.js   （全部通过退出码 0，有问题退出码 1）
   ═════════════════════════════════════════════════════════════ */
const fs = require("fs");

let fail = 0, warn = 0;
const ok = (m) => console.log("  ✓ " + m);
const bad = (m) => { fail++; console.log("  ✗ " + m); };
const tip = (m) => { warn++; console.log("  ⚠ " + m); };
const exists = (f) => fs.existsSync(f);

const htmls = fs.readdirSync(".").filter((f) => f.endsWith(".html"));
console.log("\n── 1/7 断链检查（每页 href/src 指向的本地文件）──");
const refRe = /(?:href|src)="([^"?#]+)(?:\?[^"]*)?"/gi;
const stripComments = (s) => s.replace(/<!--[\s\S]*?-->/g, "");
for (const page of htmls) {
  const html = stripComments(fs.readFileSync(page, "utf8"));
  let m, misses = [];
  while ((m = refRe.exec(html)) !== null) {
    const ref = m[1];
    if (/^(https?:|mailto:|data:|#|\/\/)/.test(ref)) continue;
    if (/[${}'"+\s]/.test(ref)) continue; /* JS 模板串 / 拼接产生的假链接 */
    const clean = ref.startsWith("/") ? ref.slice(1) : ref.split("#")[0];
    if (!clean) continue;
    if (!exists(clean)) misses.push(ref);
  }
  if (misses.length) bad(page + " 断链: " + misses.join(", "));
}
ok("断链检查完成（页面数 " + htmls.length + "）");

console.log("\n── 2/7 sitemap ↔ 文件 ──");
const sm = fs.readFileSync("sitemap.xml", "utf8");
const locs = [...sm.matchAll(/<loc>https:\/\/goodkx\.github\.io\/([^<]*)<\/loc>/g)].map((m) => m[1]);
for (const loc of locs) {
  const f = loc === "" ? "index.html" : loc;
  if (!exists(f)) bad("sitemap 引用了不存在的文件: " + loc);
}
ok("sitemap 检查完成（" + locs.length + " 个 URL）");

console.log("\n── 3/7 搜索索引目标 ──");
const searchJs = fs.readFileSync("search.js", "utf8");
const blogHtml = fs.readFileSync("blog.html", "utf8");
const sEntries = [...searchJs.matchAll(/u:\s*"([^"]+)"/g)].map((m) => m[1]);
for (const u of sEntries) {
  const file = u.split("#")[0].split("?")[0];
  if (file && !exists(file)) bad("search.js 指向不存在的页面: " + u);
  const post = u.match(/blog\.html#\/post\/([a-z0-9\-]+)/);
  if (post && !blogHtml.includes('"' + post[1] + '": {')) bad("search.js 引用了 POSTS 里不存在的文章 id: " + post[1]);
}
ok("搜索索引检查完成（" + sEntries.length + " 条）");

console.log("\n── 4/7 博客 ORDER ↔ POSTS ──");
const orderM = blogHtml.match(/const ORDER = \[([^\]]*)\]/);
const orderIds = orderM ? [...orderM[1].matchAll(/"([a-z0-9\-]+)"/g)].map((m) => m[1]) : [];
const postIds = [...blogHtml.matchAll(/^      "([a-z0-9\-]+)": \{$/gm)].map((m) => m[1]);
for (const id of orderIds) if (!postIds.includes(id)) bad("ORDER 里的文章不在 POSTS 中: " + id);
for (const id of postIds) if (!orderIds.includes(id)) bad("POSTS 里的文章不在 ORDER 中（列表/上下篇会漏）: " + id);
if (orderIds.length === postIds.length) ok("ORDER 与 POSTS 一致（" + postIds.length + " 篇）");

console.log("\n── 5/7 首页页面导航卡片 ──");
const idxHtml = fs.readFileSync("index.html", "utf8");
const rowsStart = idxHtml.indexOf('<div class="hscroll-rows" id="pages-rows">');
const rowsBlock = rowsStart >= 0 ? idxHtml.slice(rowsStart, idxHtml.indexOf("两行同时滚动", rowsStart)) : "";
const navHrefs = [...rowsBlock.matchAll(/href="([a-z0-9\-_.]+\.html)"/g)].map((m) => m[1]);
for (const h of navHrefs) if (!exists(h)) bad("页面导航卡指向不存在的页面: " + h);
ok("导航卡片检查完成（" + navHrefs.length + " 张）");

console.log("\n── 6/7 活数字漂移（宣称值 vs 实际值）──");
const claim = (re, src) => { const m = src.match(re); return m ? +m[1] : null; };
/* 文章数 */
const postsReal = postIds.length;
const postsClaim = claim(/📄 (\d+) 篇文章/, idxHtml);
(postsClaim === null ? tip("首页数据条缺「N 篇文章」") : postsClaim === postsReal ? ok("文章数 " + postsReal + " ✓") : bad("文章数漂移：首页宣称 " + postsClaim + "，实际 POSTS " + postsReal));
/* 工具数 */
const toolsReal = (fs.readFileSync("tools.html", "utf8").match(/<section class="tool[ "]/g) || []).length;
const toolsClaim = claim(/🧰 (\d+) 个工具/, idxHtml) ?? claim(/(\d+) 个纯前端小工具/, idxHtml);
(toolsClaim === null ? tip("首页缺「N 个工具」宣称") : toolsClaim === toolsReal ? ok("工具数 " + toolsReal + " ✓") : bad("工具数漂移：宣称 " + toolsClaim + "，实际 " + toolsReal));
/* 画作数 */
const galleryHtml = fs.readFileSync("gallery.html", "utf8");
const artReal = (galleryHtml.match(/<figure class="photo/g) || []).length;
const artClaim = claim(/🖼️? (\d+) 幅画/, idxHtml) ?? claim(/art: <span class="c-num">(\d+)/, idxHtml);
(artClaim === null ? tip("首页缺「N 幅画」宣称") : artClaim === artReal ? ok("画作数 " + artReal + " ✓") : bad("画作数漂移：宣称 " + artClaim + "，实际 " + artReal));
/* 游戏数 */
const gamesReal = ["game.html", "tetris.html", "memory.html", "minesweeper.html"].filter(exists).length;
const gamesClaim = claim(/games: <span class="c-num">(\d+)/, idxHtml);
(gamesClaim === null ? tip("关于卡缺 games 数") : gamesClaim === gamesReal ? ok("游戏数 " + gamesReal + " ✓") : bad("游戏数漂移：关于卡 " + gamesClaim + "，实际 " + gamesReal));

console.log("\n── 7/7 资源版本号漂移报告 ──");
const vMap = {};
for (const page of htmls) {
  const html = fs.readFileSync(page, "utf8");
  for (const m of html.matchAll(/([a-z\-]+\.(?:css|js))\?v=(\d+)/gi)) {
    const name = m[1].toLowerCase();
    (vMap[name] = vMap[name] || new Set()).add(m[2]);
  }
}
let drifted = 0;
for (const [name, set] of Object.entries(vMap)) {
  if (set.size > 1) { drifted++; tip(name + " 出现多个版本号: " + [...set].join(", ") + " → 建议统一"); }
}
if (!drifted) ok("各资源版本号全站一致（" + Object.keys(vMap).length + " 个资源）");
const vs = new Set(Object.values(vMap).flatMap((s) => [...s]));
if (vs.size > 1) tip("全站共出现 " + vs.size + " 个不同版本号（" + [...vs].sort().join(", ") + "）—— 大改后建议统一 bump 一次");

console.log("\n══════════ 结果：✓ 通过 ｜ ✗ 失败 " + fail + " ｜ ⚠ 提示 " + warn + " ══════════");
process.exit(fail ? 1 : 0);
