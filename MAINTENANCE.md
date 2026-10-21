# 🛠 维护手册（MAINTENANCE）

> 给未来的自己（或任何接手的人 / AI）：这个网站怎么运作、怎么扩展、怎么救急。
> 配套：`AGENTS.md`（AI 会话操作守则）· `check.js`（自检脚本，`node check.js`）。

## 一、架构速览

**纯静态、零框架、零构建**：手写 HTML/CSS/JS，托管在 GitHub Pages（全球）+ 腾讯 EdgeOne（国内）。
没有 package 构建、没有框架运行时——所有"动态"能力来自两样东西：

1. **textdb.dev 免注册云存储**（一个 URL 就是一个公开 JSON 桶）
2. **GitHub Pages / EdgeOne Pages** 的静态托管

| 文件 | 职责 |
|---|---|
| index.html | 首页（全部区块 + 内联样式/脚本；五区五版式：bento 技能 / 编号列表项目 / 竖线经历 / 卡片码头 / 3D 滚筒日志） |
| arcade.html | 街机厅（四台机台 + 荣誉墙 = 四游戏排行榜聚合） |
| blog.html | 博客（**数据内联**：POSTS 对象 + ORDER 数组 + 静态列表卡，三者都要注册，见下文 SOP） |
| gallery.html | 相册（上半：内联 SVG 画作 .photo 块；下半：照片墙 .shot，数据来 textdb `cccad-photos`） |
| admin-upload.html | 📤 站长照片上传台（GitHub Contents API 写 `gallery/p/`，统一 3:2 缩略图 + 原图） |
| tools.html | 工具箱（14 个 `<section class="tool">`） |
| shop.html | 小卖部（云端商品/订单，站长口令见文件内 ADMIN_PASS） |
| game/tetris/memory/minesweeper.html | 四款游戏（都接 leaderboard.js） |
| guestbook.html | 云留言板（四级回退 + 站长管理 + JSON 导出） |
| report.html | 年报（读各云端键出报告） |
| live.html | 《高性价比人生指南》全文（第三方内容，CC BY 4.0，**不要改它的内部结构**） |
| style.css | 仅首页样式 |
| subpage.css | 全部内页共用外壳（含刊头幽灵字） |
| theme.css | 全站：四主题变量 + 质感层 + 动效层（**加载顺序在最后，html 前缀提优先级**） |
| theme.js | 全站：主题切换 + PWA + 浮动按钮 + 标题彩蛋 + 终端倾斜 + 页脚状态行 |
| search.js / search.css | 全站搜索（Ctrl+K） |
| leaderboard.js | 游戏排行榜共享模块（textdb 读写） |
| script.js | 仅首页交互（打字机等） |
| sw.js / manifest.json / offline.html / icons/ | PWA 三件套 |
| feed.xml / sitemap.xml / robots.txt | SEO / RSS |
| functions/api/messages.js | EdgeOne Pages Function（留言板备用 API，EdgeOne 部署才生效） |
| check.js | 🔍 自检脚本（部署前必跑） |

## 二、云端数据键（textdb.dev，key 即地址）

`https://textdb.dev/api/data/<KEY>` — GET 读 / POST 写（写 JSON 对象，中文要转义成 \uXXXX）。

| KEY | 内容 |
|---|---|
| cccad-gb-95592aa7 | 留言板（messages 数组） |
| cccad-shop-products | 小卖部商品 |
| cccad-shop-orders | 小卖部订单 |
| cccad-site-stats | 共同记录（来访/打卡等） |
| cccad-lb-2048 / -memory / -tetris / -mines / -typing | 五款游戏排行榜（{list:[{n,s,d}]}） |
| cccad-notice | 站长公告（{msg, d}——全站底部横条，留言板站长端发布） |
| cccad-photos | 相册照片墙清单（{photos:[{id,t,d,thumb,full,w,h,sz,ts}]}——上传台自动写） |

**备份**（建议每月跑一次，结果存到本地仓库外）：

```bash
for k in cccad-gb-95592aa7 cccad-shop-products cccad-shop-orders cccad-site-stats \
         cccad-lb-2048 cccad-lb-memory cccad-lb-tetris cccad-lb-mines cccad-lb-typing cccad-notice \
         cccad-photos; do
  curl -s "https://textdb.dev/api/data/$k" -o "backup-$k.json"
done
```

**恢复**：把备份内容原样 POST 回对应 key（Content-Type: text/plain，保持对象形状，不要 POST 裸数组）。

**已知限制（诚实清单）**：textdb 是公开桶——知道 key 的任何人都能写；站长口令（ADMIN_PASS）在前端文件里可见，属门禁级不是加密；排行榜理论上可被覆盖。别把敏感数据放进来。

## 三、常见任务 SOP

### 加一篇博客（6 步，缺一不可）
1. `blog.html` 的 `POSTS` 加文章对象（id、title、date、tags、html）
2. `ORDER` 数组头部插入同一 id
3. 博客**列表是静态卡片**：复制一个 `<a class="post">` 块放最上面
4. `search.js` 加一条索引
5. `feed.xml` 加一条 item
6. 首页数字会漂移 → 跑 `node check.js`，按提示改首页「📄 N 篇文章」

### 加一个页面（5 步）
1. 复制任一内页改内容（保留 head 的样式/脚本引用清单）
2. `<h1 data-word="代号">` 设专属幽灵字
3. 首页页面导航加卡（编号顺延）
4. `search.js` + `sitemap.xml` 各加一条
5. `node check.js` 验证

### 加一个游戏（7 步）
1. 复制 minesweeper.html 改玩法
2. `leaderboard.js` 的 KEYS 加键、`better()` 加排序方向（升序还是降序要想清楚）
3. `arcade.html` 加一台机台（--cab-c 选主题色）+ 荣誉墙加一块面板
4. 游戏页顶栏确认有「🕹 街机厅」返回口
5. 首页**不用**加单独游戏卡（已统一收进街机厅）
6. 关于卡 `games:` 数字 +1
7. `node check.js`

### 加一个工具
复制 `<section class="tool">` + 写函数即可；`node check.js` 会自动校验首页宣称的工具数。

### 上传照片到相册照片墙（固定 3:2 预览 + 点开看原图）
**入口**：`admin-upload.html`（相册页右上「站长上传 ↗」也能进）。

1. 第一步粘 GitHub 令牌（只需一次，存在本机 localStorage）：
   - 本机最快：`gh auth token | Set-Clipboard`（或 `gh auth token` 复制）
   - 更安全：新建细粒度令牌 → 仅 `goodkx.github.io` 仓库 → **Contents: Read and write**
2. 拖照片进去 → 填标题 → 开始上传。每张会：
   - 客户端 canvas **居中裁切 3:2 → 1200×800 JPEG** 存 `gallery/p/<日期>-<id>-t.jpg`（所有照片预览因此长一样）
   - 原图原样存 `gallery/p/<日期>-<id>.<ext>`（>6MB 会压到长边 3200，界面会标注）
   - 清单写进 textdb `cccad-photos`（最新在前）
3. 等 30–90 秒 Pages 构建；上传台会自动轮询构建状态，构建没完时相册卡片显示「⏳ 构建中」并 20 秒后自动重试。
4. 删除：上传台第三步点「删除」——同时删清单条目和仓库里的两个文件。

**注意**：令牌等于仓库写权限，只存在自己浏览器；换电脑/清缓存要重粘。`gallery.html` 只读 textdb 清单，不需要令牌。

### 改样式
- 只影响首页 → style.css；影响所有内页 → subpage.css；全站（含主题）→ theme.css
- **改完任何 css/js：全站统一 bump 版本号**（当前单版本策略 v130）：
  `sed -i 's/?v=[0-9]*/?v=125/g' *.html`
- `node check.js` 第 7 项会报告版本漂移

## 四、部署

**标准通道**：`git add -A && git commit -m "..." && git push origin main`
（部署身份已配好：CCCAD / chenmidiy@163.com）

**备用通道（git 断连时，实测可用）**——Contents API 逐文件上传：

```bash
SHA=$(gh api repos/goodkx/goodkx.github.io/contents/文件名 --jq '.sha')
node -e "const fs=require('fs');const [f,sha]=process.argv.slice(1);
fs.writeFileSync(process.env.TEMP+'/p.json', JSON.stringify({message:'提交信息',
content: fs.readFileSync(f).toString('base64'), sha}));" 文件名 "$SHA"
gh api -X PUT repos/goodkx/goodkx.github.io/contents/文件名 --input "$TEMP/p.json" --jq '.commit.sha'
```

多文件时循环执行。API 部署后本地会落后：`git fetch origin && git reset --hard origin/main` 对齐；
fetch 也断时 `gh api repos/.../tarball/main > repo.tgz` 解包覆盖本地文件。

**部署后必等 CDN**：GitHub Pages 的 HTML 缓存 ~10 分钟（查询参数会被 CDN 忽略，不能用来穿透）。
验证用 `curl -s 线上URL | grep 新内容标记`，别只看浏览器（浏览器还有本地缓存）。

## 五、浏览器兼容性（2026-10-11 审计）

**真实测试**：Chromium（Chrome/Edge）全站 17 页逐页实测。
**其他引擎**：按「特性支持 + 降级路径」审计（Firefox / Safari / 旧 Chrome）。

| 特性 | Chrome | Firefox | Safari | 降级表现 |
|---|---|---|---|---|
| color-mix()（渐变边框/极光/幽灵字） | 111+ | 113+ | 16.2+ | 关键处已写静态 rgba 回退；其余丢失该层装饰，不破版 |
| @view-transition 页面转场 | 123+ | 暂无（忽略） | 18+ | 无转场，直接跳页 |
| :has()（日志/页面网格展开） | 105+ | 121+ | 15.4+ | 老引擎展开功能退化，不影响阅读 |
| backdrop-filter（磨砂） | 全部（已配 -webkit-） | 103+ | 全部（已配 -webkit-） | 无磨砂，卡片仍半透明可读 |
| mask-image（渐隐遮罩） | 全部（已配 -webkit-） | 53+ | 全部（已配 -webkit-） | 无渐隐，边缘生硬但不破版 |
| -webkit-text-stroke（刊头幽灵字） | 全部 | 48+（支持该前缀） | 全部 | @supports 守卫：无描边 → 实色淡字回退 |
| -webkit-user-select / background-clip | 已全站配对（审计 0 缺失） | — | — | — |
| background-attachment: fixed（极光） | ✓ | ✓ | iOS 忽略 | ≤960px 已改为 scroll，移动端不受影响 |
| ES2020（可选链/空值合并/async） | 80+ | 74+ | 13.1+ | 2020 年后浏览器全兼容 |

**规则**：新增 CSS 特性时——①关键视觉必须写静态回退（回退行写在 color-mix 行之前）；②mask/backdrop-filter/background-clip/user-select 必须同时写 -webkit- 与标准形式；③纯装饰特性可裸用（丢了不破版）。改完跑 `node "$TEMP/prefix_audit.js"` 式审计或手动 grep。

## 六、故障排查速查

| 症状 | 原因 / 解法 |
|---|---|
| 改了线上没变化 | CDN 10 分钟 TTL → 等或 Ctrl+F5；HTML 引用的资源版本号没 bump → bump |
| 手机横向滚动 | 某元素出血超出视口 → 逐个 `display:none` 二分定位（参考 theme.css 里极光晕的修法） |
| 新区块/卡片隐身 | 用了 .reveal 但页面没加 IntersectionObserver 观察器（arcade.html 踩过） |
| 列表不显示新文章 | 只注册了 POSTS/ORDER，忘了静态列表卡（blog 踩过） |
| push 一直失败 | 走上面的 Contents API 备用通道（当前已改用 SSH：`git@github.com:goodkx/goodkx.github.io.git`，github.com:443 被墙也不影响） |
| 上传了照片，相册没有 | ① 构建还没跑完（30–90 秒）② textdb `cccad-photos` 没写成功（上传台第三步能看到列表才算成功）③ 令牌没有 Contents 写权限 |
| 主题不对 | 访客浏览器 localStorage 存了手动选择 → 🎨 重选；默认已固定「深空绿·终端」，无自动换肤 |

## 七、红线（每条都有教训）

1. **不可逆操作前逐字验证路径**——`rm -rf` 曾误删整站（靠远端才救回）
2. **验收必须真实点击**——evaluate 的 JS click 会绕过可见性检查（tetris 开始按钮教训）
3. **375px 零横向溢出是红线**——新元素的出血装饰必查（极光晕教训）
4. **静态列表 + 数据层要双注册**（blog 教训）
5. **改 css/js 必 bump 版本 + 跑 `node check.js`**
6. **贪吃蛇是用户主动下架的**，别擅自恢复
