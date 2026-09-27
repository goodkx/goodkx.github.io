/* ═══════ 全站搜索（Ctrl+K / ⌘K）═══════
   纯前端索引：覆盖全站页面、区块、工具与文章。
   依赖 theme.css 的变量与 theme.js 的注入模式。 */

(function () {
  const INDEX = [
    { t: "首页 · 个人主页", d: "index.html", u: "index.html", k: "home 主页 hero 终端" },
    { t: "关于我", d: "自我介绍 + about_me.js", u: "index.html#about", k: "about 关于 介绍" },
    { t: "技能", d: "前端 / 后端 / 数据库 / 工具链", u: "index.html#skills", k: "skills 技能栈 技术栈" },
    { t: "项目", d: "作品展示", u: "index.html#projects", k: "projects 项目 作品" },
    { t: "经历", d: "时间线", u: "index.html#timeline", k: "timeline 经历 时间线" },
    { t: "页面导航", d: "全站页面入口卡片", u: "index.html#pages", k: "导航 页面 sitemap" },
    { t: "联系我", d: "邮箱 · GitHub · X", u: "index.html#contact", k: "contact 联系 邮箱 email" },
    { t: "博客", d: "文章列表", u: "blog.html", k: "blog 博客 文章" },
    { t: "文章 · 用 AI 搭建自己的个人网站", d: "blog.html", u: "blog.html#/post/ai-site", k: "ai 建站 协作 github pages" },
    { t: "文章 · 27 软件工程考研备考路线", d: "blog.html", u: "blog.html#/post/kaoyan-plan", k: "考研 408 数学 政治 英语 规划" },
    { t: "文章 · 从零开始学前端", d: "blog.html", u: "blog.html#/post/frontend-road", k: "前端 javascript css html 学习路线" },
    { t: "相册", d: "SVG 插画 · 点击放大", u: "gallery.html", k: "gallery 相册 照片 插画" },
    { t: "工具箱", d: "9 个纯前端小工具", u: "tools.html", k: "tools 工具箱" },
    { t: "工具 · 字数统计", d: "字符 / 词数 / 行数", u: "tools.html#tc", k: "字数 统计 计数" },
    { t: "工具 · 时间戳转换", d: "Unix 时间戳 ↔ 日期", u: "tools.html#ts", k: "时间戳 timestamp 日期" },
    { t: "工具 · 颜色转换", d: "HEX / RGB / HSL", u: "tools.html#col", k: "颜色 color hex rgb hsl" },
    { t: "工具 · 密码生成", d: "随机强密码", u: "tools.html#pw", k: "密码 password 随机" },
    { t: "工具 · Base64 编解码", d: "UTF-8 安全", u: "tools.html#b64", k: "base64 编码 解码" },
    { t: "工具 · JSON 格式化", d: "美化与校验", u: "tools.html#json", k: "json 格式化 美化" },
    { t: "工具 · 考研倒计时", d: "距离 27 初试", u: "tools.html#cd", k: "考研 倒计时 countdown 初试" },
    { t: "工具 · 进制转换", d: "2 / 8 / 10 / 16 进制", u: "tools.html#radix", k: "进制 binary hex 转换" },
    { t: "工具 · 正则测试", d: "实时匹配与高亮", u: "tools.html#regex", k: "正则 regex regexp 匹配" },
    { t: "考研大纲 · 政治（101）", d: "马原 / 毛中特 / 史纲 / 思修", u: "kaoyan.html#politics", k: "考研 政治 马原" },
    { t: "考研大纲 · 英语（201/204）", d: "题型分值与复习要点", u: "kaoyan.html#english", k: "考研 英语 单词 阅读 作文" },
    { t: "考研大纲 · 数学（301/302）", d: "高数 / 线代 / 概率", u: "kaoyan.html#math", k: "考研 数学 高数 线代 概率" },
    { t: "考研大纲 · 408 专业课", d: "数据结构 / 计组 / 操作系统 / 计网", u: "kaoyan.html#cs408", k: "考研 408 数据结构 计组 操作系统 计网" },
    { t: "考研大纲 · 备考时间线", d: "2026.9 → 2027.4 全程", u: "kaoyan.html#timeline", k: "考研 时间线 规划 复试" },
    { t: "考研 Word 指南下载", d: "软件工程专业考研全程复习指南.docx", u: "kaoyan.html#dl", k: "考研 下载 word docx 指南" },
    { t: "鹈鹕彩蛋", d: "纯 SVG 骑车动画", u: "pelican.html", k: "pelican 鹈鹕 动画 svg 彩蛋" },
    { t: "2048 小游戏", d: "方向键 / 滑动，拼出 2048", u: "game.html", k: "游戏 2048 game 玩 合成 小游戏" },
    { t: "友链", d: "朋友们的小站 · 申请友链", u: "links.html", k: "友链 friends 朋友 链接 申请" },
    { t: "更新日志", d: "网站进化史", u: "index.html#log", k: "更新 日志 changelog 版本 历史" },
    { t: "文章 · GitHub Pages 上线指南", d: "blog.html", u: "blog.html#/post/gh-pages", k: "github pages 部署 上线 建站 域名" },
    { t: "文章 · CSS 变量全站换肤", d: "blog.html", u: "blog.html#/post/theme-css", k: "css 变量 换肤 主题 前端 data-theme" },
    { t: "切换主题", d: "右下角 🎨 按钮，4 套风格", u: "", k: "主题 theme 换肤 深色 浅色 紫夜 暖纸 墨金" },
  ];

  let sel = 0;
  let cur = [];

  function build() {
    const overlay = document.createElement("div");
    overlay.id = "searchOverlay";
    overlay.innerHTML = `
      <div id="searchPanel" role="dialog" aria-label="全站搜索">
        <input id="searchInput" type="text" placeholder="搜索全站…（页面 / 工具 / 文章）" autocomplete="off" />
        <div id="searchResults"></div>
        <div id="searchHint">
          <span><kbd>↑</kbd><kbd>↓</kbd>选择</span>
          <span><kbd>Enter</kbd>打开</span>
          <span><kbd>Esc</kbd>关闭</span>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const fab = document.createElement("button");
    fab.id = "searchFab";
    fab.type = "button";
    fab.title = "搜索（Ctrl + K）";
    fab.setAttribute("aria-label", "搜索");
    fab.textContent = "🔍";
    document.body.appendChild(fab);

    const input = overlay.querySelector("#searchInput");
    const results = overlay.querySelector("#searchResults");

    const open = () => {
      overlay.classList.add("open");
      input.value = "";
      render("");
      setTimeout(() => input.focus(), 30);
    };
    const close = () => overlay.classList.remove("open");
    const toggle = () => (overlay.classList.contains("open") ? close() : open());

    const openTheme = () => {
      const tb = document.getElementById("themeBtn");
      if (tb) tb.click();
    };

    fab.addEventListener("click", toggle);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });

    function highlight(text, q) {
      if (!q) return text;
      const i = text.toLowerCase().indexOf(q.toLowerCase());
      if (i < 0) return text;
      return (
        text.slice(0, i) +
        "<mark>" + text.slice(i, i + q.length) + "</mark>" +
        text.slice(i + q.length)
      );
    }

    function render(q) {
      q = q.trim().toLowerCase();
      cur = !q
        ? INDEX.slice(0, 10)
        : INDEX.filter((it) => (it.t + " " + it.d + " " + it.k).toLowerCase().includes(q));
      sel = 0;
      if (!cur.length) {
        results.innerHTML = `<div class="empty">没有找到「${q.replace(/</g, "&lt;")}」相关内容</div>`;
        return;
      }
      results.innerHTML = cur
        .map((it, i) => {
          const href = it.u || "#";
          const themeAttr = it.u ? "" : ' data-theme-open="1"';
          return (
            `<a href="${href}" class="${i === 0 ? "sel" : ""}" data-i="${i}"${themeAttr}>` +
            `<span class="st">${highlight(it.t, q)}</span><span class="sd">${it.d}</span></a>`
          );
        })
        .join("");
      results.querySelectorAll("a").forEach((a) => {
        a.addEventListener("click", () => close());
      });
    }

    function move(dir) {
      if (!cur.length) return;
      sel = (sel + dir + cur.length) % cur.length;
      results.querySelectorAll("a").forEach((a, i) => {
        a.classList.toggle("sel", i === sel);
        if (i === sel) a.scrollIntoView({ block: "nearest" });
      });
    }

    function go() {
      const it = cur[sel];
      if (!it) return;
      close();
      if (it.u) location.href = it.u;
      else openTheme();
    }

    input.addEventListener("input", () => render(input.value));
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
      else if (e.key === "Enter") { e.preventDefault(); go(); }
    });

    results.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (a && a.dataset.themeOpen !== undefined) {
        e.preventDefault();
        close();
        openTheme();
      }
    });

    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
      } else if (e.key === "Escape") {
        close();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
