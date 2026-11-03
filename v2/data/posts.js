/* v2 博客数据：从 blog.html 抽出 */
window.POSTS = {
      "paper-redesign": {
        title: "把整站从深色改成纸感：一次不换框架的视觉重做",
        date: "2026-11-02",
        tags: ["前端", "设计", "重构"],
        html: `
          <h3>起因：自己先看腻了</h3>
          <p>这个站原本是标准的「深色科技风」：荧光绿主色、蓝紫渐变文字、玻璃卡片、三套背景动画叠在一起。刚做出来时觉得挺酷，用了两个月，每次打开都觉得像在看别人的模板——所有区块一样圆、一样亮、一样在发光。</p>
          <p>问题不在于深色，而在于<strong>装饰在互相打架</strong>：网格、粒子连线、二进制雨、渐变、发光同时开着，视线没有落点。真正想让人读的文字，反而被压在最下面。</p>
          <h3>决定：不动结构，只换材质</h3>
          <p>23 个页面、上千行样式，推倒重写的风险太大。最后选的方案是加一层<strong>覆盖样式</strong> <code class="inline">paper.css</code>，放在所有样式之后加载，只改材质、配色和字体，一行布局和类名都不碰。</p>
          <p>这样有两个好处：改动集中在一个文件里；出问题把这个文件删掉，整站立刻回到原来的样子。</p>
          <h3>具体改了四件事</h3>
          <ul>
            <li><strong>配色</strong>：暖白纸底 <code class="inline">#f6f3ec</code>，文字墨黑，只留一个赭红 <code class="inline">#a8442a</code> 做强调。荧光绿和天蓝全部下线。</li>
            <li><strong>材质</strong>：叠一层 7.5% 的纸张噪点（SVG <code class="inline">feTurbulence</code>，固定层、<code class="inline">pointer-events:none</code>），再加每 32px 一条极淡的稿纸线。</li>
            <li><strong>字体</strong>：标题换衬线（Songti / Georgia），正文保持系统黑体。混排之后，“人做的”感觉一下就出来了。</li>
            <li><strong>阴影</strong>：从一层大模糊改成两层——顶部 1px 内高光 + 底部 1px 硬线 + 远距离柔阴影，模拟纸的厚度。</li>
          </ul>
          <h3>踩到的坑：主题切换把整站拉回深色</h3>
          <p>上线后截图一看，还是深蓝底。查了半天才发现：站点有 4 套主题，其中 <code class="inline">deepseek</code> 那套用 <code class="inline">html[data-theme="deepseek"]</code> 定义了一堆深色变量，权重比我的 <code class="inline">:root</code> 高，直接把纸感覆盖掉了。</p>
          <p>解决办法是给四套主题<strong>各写一份纸感映射</strong>：深空变冷纸、紫夜变灰纸、纸白变净白、墨金变米黄。切换仍然有效，只是四种不同质感的纸，而不是切回深色。</p>
          <h3>结果</h3>
          <p>23 个页面一次性换完，没有改任何 HTML 结构。首屏多出来的成本只有一个 6.8KB 的 CSS 文件（gzip 后约 2KB），噪点是纯 CSS 背景图，不增加请求。</p>
          <p>回头再看，真正让页面“不像模板”的不是纸色，而是<strong>不规整</strong>：卡片不一样大、照片带一点旋转、标题用衬线、留白不均匀。整齐到极致就是模板，稍微歪一点才像人做的。</p>
        `
      },
      "particle-clone": {
        title: "粒子分身：从一团噪点到能认出人形",
        date: "2026-11-01",
        tags: ["前端", "Canvas", "性能"],
        html: `
          <h3>第一版：一团会动的蓝色噪点</h3>
          <p>最初的想法很简单：把看板娘的动画取一帧，按像素采样成粒子，再让粒子动起来。写完发现效果是一团蓝色噪点，完全认不出人。</p>
          <p>排查下来根因很直接：算角色包围盒时用的是<strong>整帧半透明像素</strong>，而视频里还有背景装饰（落叶、光斑），包围盒被撑到接近全屏。角色本体只占中间一小块，粒子被均匀撒在整个区域，自然就散了。</p>
          <h3>改成只框角色本体</h3>
          <p>用 <code class="inline">alpha &gt; 200</code> 的核心像素重新算包围盒，背景装饰直接排除。再按显示高度等比缩放，角色立刻回到画面中央、占满 84% 高度。</p>
          <h3>让五官能被看见</h3>
          <p>包围盒对了只是第一步，脸还是糊的。原因是采样网格太粗：2px 的间距配 2.15px 的粒子，等于把脸涂成一块色块。后来分了三层：</p>
          <ul>
            <li><strong>头部</strong>按 2px 细采，粒子尺寸跟着间距走；</li>
            <li><strong>脸部高亮区</strong>再加密一倍，让眼睛和嘴有足够的点可以落；</li>
            <li><strong>边缘</strong>按亮度梯度排序，只补最陡的前 2400 个点，勾出轮廓。</li>
          </ul>
          <p>还有一个容易忽略的坑：透明视频的 RGB 常常是<strong>预乘过 alpha</strong> 的，直接取色会偏暗。采样时除以 alpha 还原本色，再用一条对比曲线代替整体提亮，暗部细节才没被糊掉。</p>
          <h3>素材：441KB 的视频换成 28KB 的帧</h3>
          <p>做完发现线上一直是空的。抓包看到 <code class="inline">pet/idle.webm</code> 有 441KB，那条链路下载要 24 秒，采样根本等不到；而且直接给 <code class="inline">video.src</code> 会卡在 Range 请求，<code class="inline">readyState</code> 一直停在 1。</p>
          <p>最后的解法是把视频在 30% 处导出一帧，转成 WebP——每张只有 28KB，比视频小 15 倍，首屏几乎瞬间可用。顺带解决了“每次采到不同动作帧、五官时好时坏”的问题。</p>
          <h3>结果</h3>
          <p>现在是一万四千颗粒子，能认出蓝发、双马尾、白色发饰和女仆装轮廓，点击会散开再聚回来，六个动作随机轮换。整个引擎跑在 rAF 上，视口外自动暂停，弱机连续掉帧会分档削粒子。</p>
        `
      },
      "first-paint": {
        title: "静态站的首屏：删掉三个阻塞脚本之后",
        date: "2026-11-01",
        tags: ["性能", "踩坑", "前端"],
        html: `
          <h3>先量，再改</h3>
          <p>静态站的性能优化很容易变成“感觉哪里慢就改哪里”。这次先做了一件事：把每个页面引用的 CSS/JS 列出来，再用 <code class="inline">curl --compressed</code> 量线上真实传输体积。</p>
          <p>结果和直觉不太一样：CSS 一共 20.4KB（gzip 后），HTML 27.8KB，都不算大。真正压在首屏上的是<strong>阻塞脚本</strong>和一个没被注意的视频。</p>
          <h3>三个问题</h3>
          <ul>
            <li><strong>theme.js 8KB 同步阻塞</strong>：它必须在 head 里同步执行，否则主题会闪一下。但它同时包含了主题切换器、PWA 注册、安装提示——只有“读 localStorage 写 data-theme”那几行是必须早跑的。</li>
            <li><strong>宠物视频 430KB</strong>：网页宠物在 <code class="inline">DOMContentLoaded</code> 就加载 idle 动画，和首屏的关键资源抢带宽。</li>
            <li><strong>textdb 没有 preconnect</strong>：9 个页面要连第三方接口，但只有 2 个做了连接预热。</li>
          </ul>
          <h3>改法</h3>
          <p>把 theme.js 里“读主题”的 200 字节内联进 head，其余全部改 <code class="inline">defer</code>；宠物延后 1.6 秒启动；搜索、成就、排行榜三个脚本也全部 defer；给所有用到 textdb 的页面补 <code class="inline">preconnect</code>；首页 preload 粒子关键帧。</p>
          <pre><code>&lt;script&gt;try{var t=localStorage.getItem("site-theme")||"";if(t)document.documentElement.setAttribute("data-theme",t)}catch(e){}&lt;/script&gt;
&lt;script src="theme.js?v=228" defer&gt;&lt;/script&gt;</code></pre>
          <h3>结果</h3>
          <p>首屏关键路径从 56.2KB 加一个阻塞脚本，变成 48.1KB、<strong>head 里零阻塞</strong>。剩下的唯一同步脚本是 body 末尾的 <code class="inline">script.js</code>，它本来就在内容之后执行。</p>
          <p>宠物晚 1.6 秒出现，用户几乎察觉不到；主题切换器延迟加载，也不影响防闪色。</p>
          <h3>没做的部分</h3>
          <p><code class="inline">live.html</code> 单文件 196KB（gzip），内联了 874KB 的数据，理论上可以拆成 JSON 加分页渲染。但那个页面是纯阅读型，拆分会引入新的加载状态和错误分支，暂时不动——<strong>优化要按实测收益排，不是按理论上限排</strong>。</p>
        `
      },
      "typing-arcade": {
        title: "打字测速上线记：词流、WPM 和一个按键冲突",
        date: "2026-10-11",
        tags: ["前端", "游戏", "踩坑"],
        html: `
          <h3>为什么是打字测速</h3>
          <p>街机厅开到第五台，前四台都在考「反应」，唯独缺一台考<strong>手速本业</strong>的——写代码的人天天打字，却很少有人测过自己到底多快。于是这台机器的目标很纯粹：60 秒，能打多快打多快。</p>
          <h3>词流 UI：当前词大字，后面的排队</h3>
          <p>界面分两层：当前词居中大字、<strong>逐字符变色</strong>（打对变绿、打错变红划掉），后面的词半透明排队。判定极简单——按空格提交时，缓冲区和目标词<strong>忽略大小写</strong>比对，对一词记一词。</p>
          <h3>不用输入框的键盘捕获</h3>
          <p>市面上大多数打字测试放一个输入框，本站没有——直接在 <code class="inline">document</code> 上监听 <code class="inline">keydown</code>，自己拼缓冲区。好处是没有输入框的边框和光标干扰，坏处是要自己处理退格、自己挡住非字母键，还要小心<strong>别把 Ctrl+K 搜索这些快捷键也吞掉</strong>——只拦需要的键，其余全部放行。</p>
          <p>中文输入法是下一个坑：IME 合成期间 keydown 会变成 229，拿不到真实字母。所以这台机第一期是英文词流，中文模式要等把 IME 事件处理明白再上。</p>
          <h3>WPM 就是一个除法</h3>
          <p>标准算法：<code class="inline">正确字符数 ÷ 5 ÷ 分钟</code>——5 是英文单词的平均长度，空格也算一个字符。大小写不敏感，打错的不计。实时 WPM 每次统计刷新，60 秒结束定格上云。</p>
          <h3>一个真实的按键冲突</h3>
          <p>上线前自己测试，打出「t」的瞬间——<strong>主题换肤了</strong>。上一轮刚加的 T 键换肤和打字捕获撞在一起。解法是一个小模式：游戏开始时在 body 上挂 <code class="inline">keysCapture</code> 标记，全局快捷键看到标记就让路，结束自动摘除。交互系统之间也要讲道理，谁在收键，谁说了算。</p>
          <h3>结语</h3>
          <p>游戏本体一百多行，排行榜复用现成模块——街机厅做到第五台，边际成本越来越低，这就是当初坚持「排行榜抽成公共模块」的回报。去<a href="typing.html" target="_blank" rel="noopener">打字测速</a>打个 60 秒？荣誉墙第五榜还空着。</p>
        `
      },
      "tetris-lb": {
        title: "俄罗斯方块与全站排行榜：一个模块管所有游戏",
        date: "2026-10-06",
        tags: ["前端", "游戏", "踩坑"],
        html: `
          <h3>为什么是俄罗斯方块</h3>
          <p>2048、记忆翻牌都上线后，留言板点名要俄罗斯方块。它比前两款都难一档：实时下落、旋转碰撞、消行判定。但写完回头一看，<strong>真正的难点不在游戏本身，而在怎么让每一款游戏共用同一块排行榜</strong>。</p>
          <h3>一个格子的三层上色</h3>
          <p>第一版方块就是纯色方块，被评价「材质不好看」。重画后的每个格子分三层：</p>
          <pre>const g = c.createLinearGradient(x, y, x + size, y + size);
g.addColorStop(0,   shade(color,  55));  // 上亮
g.addColorStop(.5,  color);              // 本色
g.addColorStop(1,   shade(color, -45));  // 下暗
c.shadowColor = color; c.shadowBlur = 9; // 微光用方块自己的颜色
rr(c, x + p, y + p, s, s, 6); c.fill();
c.strokeStyle = "rgba(255,255,255,.3)"; c.stroke(); // 高光边</pre>
          <p><code class="inline">shade()</code> 把 hex 颜色的 RGB 三个分量同时加减一个量（自动钳制在 0–255），<code class="inline">rr()</code> 用四段 <code class="inline">arcTo</code> 画圆角路径。三层叠完方块有了体积感，而且<strong>只维护一份颜色表</strong>——调色改一处，七种方块全部生效。</p>
          <h3>下落节奏：一个会收紧的 setInterval</h3>
          <p>重力没上 requestAnimationFrame，就一句 <code class="inline">setInterval(tick, Math.max(90, 520 - (level - 1) * 60))</code>：开局半秒落一格，每升一级收紧 60 毫秒，90 毫秒封底。数字全是试出来的——再快手指就跟不上，「手感」到最后都是参数。</p>
          <h3>排行榜：一个模块管所有游戏</h3>
          <p>排行榜抽成了共享的 <code class="inline">leaderboard.js</code>，每款游戏只传三个参数：游戏名、挂载点、单位（步 / 分）。「什么算更好」也由配置决定——记忆翻牌<strong>步数越少越好</strong>（升序），其余三款分数越高越好（降序）。昵称存一次 localStorage，款款通用，不用每次重填。</p>
          <h3>免注册云存储的三个坑</h3>
          <p>云端用的是 textdb.dev：一个 key 就是一块公开的 JSON 存储，不需要注册任何账号。接入过程踩了三个坑，都记下来：</p>
          <ul>
            <li><strong>不存在的 key 返回 200 + 空响应体</strong>，不是 404。直接 <code class="inline">r.json()</code> 会抛异常——先 <code class="inline">r.text()</code>，trim 后为空就当空榜处理；</li>
            <li><strong>POST 数组会被包成 <code class="inline">{"_json":[…]}</code></strong>。对策：永远存对象，比如 <code class="inline">{ list: […] }</code>，读的时候取字段，形状就永远稳定；</li>
            <li><strong>中文直接存会 400</strong>。所有非 ASCII 字符先转义成 <code class="inline">\\uXXXX</code> 再上传，取回来 JSON.parse 会自动还原。</li>
          </ul>
          <h3>结语</h3>
          <p>游戏逻辑两百行，排行榜加云存储的兼容代码也是两百行——真实项目大多如此，看不见的部分往往比看得见的部分更费工夫。去<a href="tetris.html" target="_blank" rel="noopener">俄罗斯方块</a>扔一个方块试试？几款游戏的成绩现在全站互通。</p>
        `
      },
      "github-tutorial": {
        title: "GitHub 注册使用教程：从零开始玩转仓库",
        date: "2026-10-04",
        tags: ["建站", "GitHub", "入门"],
        html: `
          <h3>为什么每个建站的人都该有个 GitHub</h3>
          <p>一句话：<strong>免费的代码仓库 + 免费的静态网站托管 + 全球可访问</strong>。本站就托管在 GitHub Pages 上。注册只需要一个邮箱，五分钟搞定。</p>
          <h3>第一步：注册账号</h3>
          <ol>
            <li>打开 <code class="inline">github.com</code> → 右上角 <strong>Sign up</strong></li>
            <li>填邮箱 → 设密码 → 起用户名（<strong>想好再起</strong>：它会出现在你的主页网址和所有仓库地址里，注册后改名很麻烦）</li>
            <li>邮箱收验证码确认，完成</li>
          </ol>
          <h3>第二步：认识三个核心概念</h3>
          <ul>
            <li><strong>仓库（Repository）</strong>：放项目文件的地方，公开（免费建站必需）或私有都可以</li>
            <li><strong>Commit（提交）</strong>：一次存档点，记录「改了什么」，随时可以回退</li>
            <li><strong>Push（推送）</strong>：把本地的存档上传到 GitHub 云端</li>
          </ul>
          <h3>第三步：网页端就能干活</h3>
          <p>不装任何软件也能完成基本操作：<strong>New repository</strong> 建仓库 → <strong>Add file → Upload files</strong> 拖拽上传 → 自动保存为一次 commit。本站第一天就是网页端拖拽上线的。</p>
          <h3>第四步：命令行三连（进阶）</h3>
          <pre>git add -A
git commit -m "更新内容"
git push</pre>
          <p>想更省事可以装 <strong>GitHub CLI</strong>：<code class="inline">gh auth login</code> 走设备码授权——浏览器里输入六个字母就登录，不用配 SSH 密钥。</p>
          <h3>第五步：免费建站</h3>
          <p>仓库命名 <code class="inline">用户名.github.io</code> → 上传网页文件 → Settings → Pages → 一分钟后 <code class="inline">用户名.github.io</code> 全球可访问。详细部署步骤见<a href="#/post/gh-pages">上一篇部署指南</a>。</p>
          <h3>常见坑</h3>
          <ul>
            <li>用户名起得太随意——它就是你的技术名片，想好再注册</li>
            <li>推送后立刻刷新看不到更新——CDN 构建需要一两分钟，等等再刷</li>
            <li>API 令牌（Token）相当于密码，泄露了立刻去 Settings → Developer settings 撤销重建</li>
            <li>免费账号必须<strong>公开仓库</strong>才能用 Pages 建站</li>
          </ul>
          <p>注册好之后，欢迎去<a href="#/post/gh-pages">部署指南</a>把你的第一个网站挂上去。</p>
        `
      },
      "fish-notes": {
        title: "摸鱼日历的开发笔记：一个倒计时的边界问题",
        date: "2026-10-01",
        tags: ["前端", "工具", "摸鱼"],
        html: `
          <h3>需求很简单？</h3>
          <p>摸鱼日历的核心功能一句话就能说完：显示今天周几、距离周末和下班还有多久、点个打卡。但真动手写，边界情况一个接一个冒出来。</p>
          <h3>最有趣的边界：连续打卡从哪天起算</h3>
          <p>「连续打卡 N 天」听起来清晰，实现时却有个经典陷阱：如果用户今天还没打卡，连续天数应该<strong>从昨天往前算</strong>；打过卡，才从今天起算。漏掉这个判断，每天早上打开页面都会看到「连续 0 天」——坚持了很久的记录一夜清零，非常劝退。</p>
          <pre>// 今天没打卡？从昨天开始数
if (!set.has(today)) d.setDate(d.getDate() - 1);
while (set.has(key(d))) { streak++; d.setDate(d.getDate() - 1); }</pre>
          <h3>其他小设计</h3>
          <ul>
            <li><strong>距下班</strong>：过了 18:00 显示「已下班 🎉」，周末直接显示「不用班 🎉」——工具要有情绪</li>
            <li><strong>语录轮换</strong>：按「日期 + 小时」取模，同一天内稳定、隔天自动换，不需要随机数</li>
            <li><strong>数据结构</strong>：打卡记录就是 <code class="inline">["2026-10-01", ...]</code> 字符串数组，存取、查重、算连续都最简单</li>
          </ul>
          <h3>结语</h3>
          <p>小工具的魅力就在这：需求一行字，实现一百行，而每一行边界都是一次小小的产品思考。去工具箱摸一局试试？</p>
        `
      },
      "ai-learn": {
        title: "我如何用 AI 学习前端：不做伸手党",
        date: "2026-10-01",
        tags: ["AI", "学习", "前端"],
        html: `
          <h3>先说结论</h3>
          <p>AI 是这个时代最好的学习搭子——前提是<strong>你不把它当外包</strong>。这个网站从第一行 HTML 到云留言板，全程和 AI 结对完成，全程没有抄过一段自己看不懂的代码。</p>
          <h3>我的三步工作法</h3>
          <ol>
            <li><strong>把想法讲清楚</strong>：不说「帮我做个网站」，而是「我要一个深色底的 hero 区，左边文字右边终端窗口，打字机效果」——描述得越具体，产出越接近想象</li>
            <li><strong>让 AI 写，自己验收</strong>：每一版都亲眼看效果，不对就描述差异让它改。改的过程就是学习的过程</li>
            <li><strong>追问为什么</strong>：看到不懂的写法就问「这里为什么这么写」，AI 是个永远不烦的老师</li>
          </ol>
          <h3>一个真实的教训</h3>
          <p>留言板曾经 100% 发布失败，排查了半天网络，最后发现是 AI 写的代码里引用了一个不存在的变量。那次学到的不是「AI 会犯错」，而是：<strong>验收是你的责任，永远要走一遍真实用户的路径</strong>。这件事我写成了<a href="#/post/gb-cloud">踩坑记</a>。</p>
          <h3>给同路人的三句话</h3>
          <ul>
            <li>从真实需求出发——给自己做个网站，比跟着教程做 TODO List 有动力一百倍</li>
            <li>让 AI 解释，而不只是给答案</li>
            <li>把作品发布出去，公开的东西会逼你认真</li>
          </ul>
        `
      },
      "toolbox-principles": {
        title: "十四件小工具背后的共同原则",
        date: "2026-10-01",
        tags: ["工具", "隐私", "产品"],
        html: `
          <h3>为什么全做成本地工具</h3>
          <p>工具箱里的十四件东西——从字数统计到网速测试——遵守同一套原则：<strong>本地优先、零依赖、解决真问题</strong>。数据永远不出你的浏览器，没有账号、没有上传、没有追踪。</p>
          <h3>三条原则具体是什么</h3>
          <ul>
            <li><strong>本地优先</strong>：密码生成、Base64、JSON 格式化……敏感操作全在浏览器里完成。代价是没有跨设备同步，换来的是绝对隐私</li>
            <li><strong>零依赖</strong>：不引第三方库，页面加载飞快，断网也能用。代价是每个效果都手写，比如文本对比里的 LCS 算法</li>
            <li><strong>自己会用</strong>：每一件工具都来自真实需求——摸鱼要看下班倒计时，写博客要测网速，复习要倒计时</li>
          </ul>
          <h3>一个例外</h3>
          <p>网速测试需要访问测速节点，是唯一「联网」的工具。它用了 Cloudflare 的公共测速端点——即便如此，测速记录依然只存在你自己的浏览器里。</p>
          <p>原则这东西，说起来简单，守住靠每一次「这里要不要加个上传」的取舍。</p>
        `
      },
      "gb-cloud": {
        title: "留言板上云踩坑记：从审批罗生门到一个变量名",
        date: "2026-09-28",
        tags: ["建站", "踩坑", "前端"],
        html: `
          <h3>目标</h3>
          <p>留言板不能只是自己看着玩——要让<strong>所有访客</strong>都能发、都能看。这意味着数据必须放云端，而不是浏览器本机。听起来一句话的事，实际走了好几天弯路。</p>
          <h3>坑一：EdgeOne KV 的"审批罗生门"</h3>
          <p>部署站点的 EdgeOne Pages 自带 KV 存储，控制台点开通，按钮却是灰色的 <code class="inline">Pending Approval</code>——提交申请后进入人工审核。免费服务要审批可以理解，但留言板等不起，只能先绕路。</p>
          <h3>坑二：默认域名 401 之谜</h3>
          <p>更诡异的是整站时不时 401，控制台里却翻不到任何"访问认证"开关。翻了官方错误码文档才恍然大悟：</p>
          <ul>
            <li>加速区域包含中国大陆的项目，默认域名必须用<strong>带签名的预览链接</strong>访问，有效期约 3 小时，过期即 401</li>
            <li>这就是"昨天还好好的网站今天就打不开了"的全部真相</li>
            <li>解法只有两条：绑自定义域名，或换加速区域</li>
          </ul>
          <h3>坑三：Supabase 在国内不可达</h3>
          <p>提前备好的 Supabase 数据库，从本机连续探测 30 次，HTTP 状态码全是 000（连接失败）。云端数据库再好，访客连不上就等于没有。此路封死。</p>
          <h3>最终方案：免注册的 textdb.dev</h3>
          <p>一圈排查后选定 textdb.dev：无需注册、REST 读写、支持 CORS、国内直连。前端做了四级自动回退：</p>
          <pre>EdgeOne 同源接口 → textdb 云库 → Supabase → 本机暂存</pre>
          <p>配套加固：写入自动重试、<code class="inline">text/plain</code> 免 CORS 预检、读取"暖连接"、失败原因直接显示在提示里。</p>
          <h3>大 Boss：一个变量名引发的必现故障</h3>
          <p>上线后发布依然 100% 失败，报 <code class="inline">Failed to fetch</code>。排查了缓存、预检、代理、超时……最后发现问题低级到离谱：</p>
          <pre>// 函数签名是 (n, m)
async function postMessage(n, m) {
  // 分支里却写成了 →
  const next = [...cur, { n: name, m: content }];  // ❌ 未定义变量
}</pre>
          <p><code class="inline">name</code> 恰好撞上浏览器的 <code class="inline">window.name</code>（静默为空字符串，不报错），<code class="inline">content</code> 则直接 ReferenceError——发布请求<strong>根本没发出去</strong>，然后被兜底逻辑接管，显示成"连不上云端"。而此前所有网络测试都是绕过这段代码直连的，所以每次都"一切正常"。</p>
          <h3>教训</h3>
          <ul>
            <li><strong>测真实用户路径</strong>：填表单、点按钮、走完整流程；只测接口会漏掉整条链路上的低级错误</li>
            <li><strong>错误要可视化</strong>：把真实原因显示出来。"连不上云端"四个字，浪费了半天排查时间</li>
            <li><strong>免费服务要有兜底</strong>：自动重试 + 多级回退 + 本机暂存，任何一环抽风都不丢数据</li>
          </ul>
          <p>现在的留言板：无需登录，打字就发，全员可见。欢迎去留言板踩一脚验证。</p>
        `
      },
      "ai-site": {
        title: "用 AI 搭建自己的个人网站",
        date: "2026-09-20",
        tags: ["AI", "建站"],
        html: `
          <h3>为什么要有自己的网站</h3>
          <p>社交平台的头像和简介是别人定义的模板，而个人网站是<strong>完全属于你的一块地</strong>：项目、笔记、甚至一只骑单车的鹈鹕，想放什么放什么。求职时丢出一个链接，也比一页 PDF 生动得多。</p>
          <h3>我是怎么和 AI 协作的</h3>
          <p>这套站子从零到现在，我没写过一行从零起稿的代码，全程用对话推进。方法可以浓缩成三步：</p>
          <ol>
            <li><strong>把需求说人话</strong>：不说「帮我写个响应式布局」，而是「深色科技感、首屏左边自我介绍右边一个会敲命令的终端窗口」。描述得越像你脑子里看到的画面，产出越准。</li>
            <li><strong>一小步一确认</strong>：每次只让 AI 做一个区块，做完立刻在浏览器里看。宁可十次小改，不要一次大改。</li>
            <li><strong>让 AI 自己验证</strong>：让它打开页面、逐屏截图、点击每个按钮再汇报结果。AI 检查 AI 的产出，比人肉肉眼快得多。</li>
          </ol>
          <h3>技术选型：零依赖纯静态</h3>
          <p>整站没有框架、没有构建工具、没有外部 CDN，就是 HTML / CSS / JS 三件套。好处是：</p>
          <ul>
            <li>双击文件就能本地打开，不依赖任何服务</li>
            <li>GitHub Pages 免费托管，加载飞快</li>
            <li>想改哪块直接搜到对应代码，没有「编译魔法」</li>
          </ul>
          <blockquote>约束带来自由：正因为只有三件套，AI 生成的每一行代码你都能看懂、敢修改。</blockquote>
          <h3>上线只用了三步</h3>
          <p>仓库建好之后，每次更新就是三行命令：</p>
          <pre>git add -A
git commit -m "更新说明"
git push      # 一分钟后线上自动更新</pre>
          <h3>一点感受</h3>
          <p>AI 时代做个人网站，门槛已经从「会写代码」变成了「会说清楚想要什么」。剩下的事情——配色、动效、布局——交给工具，把时间留给内容本身。</p>
        `
      },
      "gh-pages": {
        title: "GitHub Pages 从注册到上线：10 分钟部署指南",
        date: "2026-09-27",
        tags: ["建站", "GitHub"],
        html: `
          <h3>为什么选 GitHub Pages</h3>
          <p>免费、稳定、自带 HTTPS，还送一个 <code class="inline">用户名.github.io</code> 的干净域名。对纯静态站点来说，它几乎是最省心的选择——本站就跑在上面。</p>
          <h3>四步上线</h3>
          <ol>
            <li><strong>注册 GitHub</strong>：想好用户名，它会出现在你的域名里</li>
            <li><strong>建仓库</strong>：仓库名必须是 <code class="inline">用户名.github.io</code>，这是绑定域名的魔法命名</li>
            <li><strong>推送文件</strong>：网页端拖拽上传，或命令行三连</li>
            <li><strong>开启 Pages</strong>：<code class="inline">用户名.github.io</code> 仓库会自动开启，普通仓库名则要去 Settings → Pages 手动选分支</li>
          </ol>
          <pre>git add -A
git commit -m "上线"
git push   # 推送后约 1 分钟自动构建</pre>
          <h3>锦上添花</h3>
          <ul>
            <li><strong>自定义 404</strong>：根目录放一个 404.html，GitHub 会自动用它</li>
            <li><strong>robots.txt + sitemap.xml</strong>：让搜索引擎正确收录</li>
            <li><strong>OG 标签</strong>：链接分享到社交平台时显示标题和摘要卡片</li>
          </ul>
          <h3>我踩过的坑</h3>
          <ul>
            <li>中文文件名在 URL 里会被编码成 %XX，静态资源尽量用英文名</li>
            <li>Windows 下 git 提示 LF → CRLF 警告，无害，忽略即可</li>
            <li>推送后立刻刷新可能还是旧页面——CDN 构建需要时间，等等再刷</li>
            <li>国内访问时快时慢，属于网络波动，多试或绑定自定义域名</li>
          </ul>
          <blockquote>静态站的部署就该像刷新页面一样简单。三行命令，一分钟全球可见。</blockquote>
        `
      },
      "theme-css": {
        title: "一套 CSS 变量驱动全站换肤",
        date: "2026-09-27",
        tags: ["CSS", "前端"],
        html: `
          <h3>起点：写死的颜色</h3>
          <p>站点初版的深色主题体验不错，但像 <code class="inline">rgba(0,229,160,.45)</code> 这样的颜色散落在样式表十几个角落。想出一套「暖纸日间模式」？意味着全文件搜索替换，改漏一处就是灾难。</p>
          <h3>方案：变量抽离 + 属性覆盖</h3>
          <p>第一步，把所有颜色收敛到 <code class="inline">:root</code>：</p>
          <pre>:root {
  --bg: #0a0e16;
  --text: #e6edf3;
  --accent: #00e5a0;
}</pre>
          <p>第二步，每套主题就是一组同名字段的覆盖，挂在 <code class="inline">&lt;html&gt;</code> 的属性上：</p>
          <pre>html[data-theme="paper"] {
  --bg: #f5f1e8;
  --text: #1f2937;
  --accent: #059669;
}</pre>
          <p>切换时 JS 只改一个属性值，整站颜色瞬间易主：</p>
          <pre>document.documentElement.dataset.theme = "paper";
localStorage.setItem("site-theme", "paper");  // 记住选择</pre>
          <h3>两个必须踩平的坑</h3>
          <ul>
            <li><strong>加载顺序</strong>：主题覆盖文件必须在基础样式<strong>之后</strong>加载，否则选择器同权重时会被 <code class="inline">:root</code> 反超</li>
            <li><strong>闪色</strong>：如果等页面渲染完才设 <code class="inline">data-theme</code>，深色用户会先看到一帧白屏。解法是在 <code class="inline">&lt;head&gt;</code> 里同步执行一小段脚本，尽早设置属性</li>
          </ul>
          <h3>收获</h3>
          <p>重构完成后，新增一套主题只需要十几行变量——本站的「墨金 OLED」就是这么顺手加上的。好的架构会让未来的自己感谢现在的自己。</p>
        `
      },
      "kaoyan-plan": {
        title: "27 软件工程考研：从 0 到 1 的备考路线",
        date: "2026-08-30",
        tags: ["考研", "规划"],
        html: `
          <h3>先看清楚要考什么</h3>
          <p>软件工程考研初试共四门，总分 500：</p>
          <table>
            <tr><th>科目</th><th>代码</th><th>分值</th></tr>
            <tr><td>思想政治理论</td><td>101</td><td>100</td></tr>
            <tr><td>英语（一 / 二）</td><td>201 / 204</td><td>100</td></tr>
            <tr><td>数学（一 / 二）</td><td>301 / 302</td><td>150</td></tr>
            <tr><td>计算机专业基础 / 自命题</td><td>408 / 院校自定</td><td>150</td></tr>
          </table>
          <p>学硕多为「英一 + 数一 + 408」，专硕多为「英二 + 数二」，专业课可能是 408 统考，也可能是院校自命题的软件工程专业课。<strong>第一步永远是选定目标院校</strong>，之后所有复习都围绕它的考试科目展开。</p>
          <h3>全年节奏（27 考研视角）</h3>
          <ul>
            <li><strong>3 – 6 月 · 基础</strong>：数学教材 + 基础班，英语单词与长难句每天不落</li>
            <li><strong>7 – 8 月 · 强化</strong>：暑期黄金期，数学强化 + 408 第一轮，政治可以开始马原</li>
            <li><strong>9 – 10 月 · 真题</strong>：近十年真题一刷，10 月研招网报名</li>
            <li><strong>11 月 · 冲刺</strong>：肖八、作文模板、二刷错题</li>
            <li><strong>12 月 · 决胜</strong>：肖四背诵 + 全真模考，初试预计 12 月下旬</li>
          </ul>
          <h3>公共课策略速记</h3>
          <ul>
            <li><strong>政治</strong>：前期只投入马原理解，大题相信肖四，性价比之王</li>
            <li><strong>英语</strong>：真题为王，阅读精读两遍胜过任何模拟题，单词背到考前一天</li>
            <li><strong>数学</strong>：得数学者得考研，每天保证 3 小时，错题本比刷新题重要</li>
            <li><strong>408</strong>：四门课里数据结构与计组占 90 分，先啃这两块硬骨头</li>
          </ul>
          <h3>本站的配套资源</h3>
          <p>我整理了一份<a href="kaoyan.html">考研大纲页面</a>，按科目列出了全部考点，可以当 checklist 用；配套的 <a href="files/kaoyan.docx" download>Word 版全程复习指南</a>也可以直接下载打印。</p>
          <blockquote>考研是场信息战 + 持久战。方法对了，剩下的就是重复。</blockquote>
        `
      },
      "frontend-road": {
        title: "从零开始学前端：一条不踩坑的路线",
        date: "2026-05-18",
        tags: ["前端", "学习"],
        html: `
          <h3>先想清楚学来干什么</h3>
          <p>「学前端」太模糊。目标定成<strong>三个月后能独立做出一个自己的网站</strong>，路线自然就清晰了——本站就是一个零框架的例子。</p>
          <h3>第一阶段：HTML + CSS（约 3 周）</h3>
          <ul>
            <li>别背标签，直接上手写：第一周仿写一个喜欢的静态页面</li>
            <li>重点吃透<strong>盒模型、Flex、Grid</strong> 三样，能解决 90% 布局问题</li>
            <li>每写完一个页面，用浏览器开发者工具逐个元素检查</li>
          </ul>
          <h3>第二阶段：JavaScript 核心（约 6 周）</h3>
          <ul>
            <li>先啃 DOM 与事件——让页面「活」起来，成就感最强</li>
            <li>再补作用域、闭包、<code class="inline">this</code>、原型，这些面试必问</li>
            <li>异步是分水岭：<code class="inline">Promise</code> → <code class="inline">async/await</code>，用 fetch 调一次公开 API 练手</li>
          </ul>
          <h3>第三阶段：项目驱动（持续）</h3>
          <p>按这个顺序做，每完成一个就部署上线：</p>
          <ol>
            <li>个人主页（纯静态，练布局与审美）</li>
            <li>待办清单（练增删改查与 localStorage）</li>
            <li>天气 / 计数类小工具（练异步与第三方 API）</li>
            <li>博客或作品集（综合 + SEO）</li>
          </ol>
          <h3>常见的坑</h3>
          <ul>
            <li> ❌ 教程收藏了几十个，一行代码没写过 —— <strong>教程只看一个，代码每天写</strong></li>
            <li> ❌ 上来就学框架 —— 原生不牢，框架也只是知其然</li>
            <li> ❌ 追求「学完再做」—— 做的过程中学，才是常态</li>
          </ul>
          <h3>推荐资源</h3>
          <p>MDN 当字典查；现代 JavaScript 教程（javascript.info）系统过一遍；遇到布局问题先想 Flex 能不能解。学完别忘了把作品挂到自己的网站上——比如就挂在这里。</p>
        `
      }
};
