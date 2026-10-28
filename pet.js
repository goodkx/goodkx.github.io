/* ═══════ 🐋 网页宠物 · 鲸鲸 ═══════
   鲸鲸形象与动画素材来自开源项目 dsh-pet（PC2005-cloud，MIT License），
   全库收录：9 段精选常驻 pet/（约 3.7MB），其余 97 段按需加载 pet/all/（约 48MB，见 manifest.json）。
   行为：待机呼吸 → 随机小剧场 → 点击互动 / 拖拽甩飞反弹 / 久置入睡；双击/右键呼出「点播台」
   任意点播动作（含舞狮头/回原位/下班）；下班后左下角留召唤铃，一键召回。
   样式自注入（不依赖站内 CSS）；prefers-reduced-motion / 流量敏感场景自动退场。 */

(function () {
  /* ── 环境守卫：减弱动效、本会话已下班、不支持 video → 全部静默退出 ── */
  try {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (sessionStorage.getItem("pet-off") === "1") return;
  } catch (e) {}
  if (!document.createElement("video").canPlayType) return;

  var DIR = "pet/";
  var ASSETS = {
    idle: "idle.webm",      drag: "drag.webm",
    happy: "click-happy.webm", angry: "click-angry.webm",
    sleep: "sleep.webm",    code: "code.webm",
    tanghulu: "tanghulu.webm", sigh: "sigh.webm", liondance: "liondance.webm"
  };
  var LOOPS = { idle: 1, drag: 1, sleep: 1 };
  var THEATER = ["code", "tanghulu", "sigh"];   /* 随机小剧场剧目 */

  /* ── 台词池（站内一贯的没正形风格） ── */
  var LINES = {
    hello: ["嗨，我是鲸鲸，租住在本站左下角", "站长用三条小鱼干雇的我", "这片网页的海域归我巡逻"],
    click: ["戳什么戳，鲸也是有脾气的", "再戳就要收费了：一次一条小鱼干", "咔——你戳中了鲸的开关", "鲸皮很厚，但不代表没有心"],
    grab: ["诶诶诶，放我下来！", "绑架鲸鱼是要坐牢的！", "我恐高！！"],
    fly: ["我飞～～～", "鲸生第一次飞行，值了", "别接！让我再飞一会儿"],
    sleep: ["Zzz…（梦见自己变成一朵云）"],
    wake: ["唔……到饭点了吗？", "谁！谁在摸我！"],
    bye: ["好嘞，打卡下班，明天见～"],
    code: ["这行代码我也看不懂，但大受震撼", "别催了，在写了在写了"],
    tanghulu: ["冰糖葫芦，酸掉牙但快乐", "甜的酸的，都是生活"],
    liondance: ["锣鼓一响，好运登场！", "这头狮子采的不是青，是 bug"],
    sigh: ["需求又变了……哦，这儿没甲方", "叹气专用动画，按次计费"]
  };
  function pick(a) { return a[(Math.random() * a.length) | 0]; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  var box, vid, bub;                 /* 容器 / 视频 / 气泡 */
  var x = 18, y = 0;                 /* 容器左上角坐标 */
  var cur = "";                      /* 当前播放的状态名 */
  var urls = {}, dead = {};          /* 已就绪 blob URL / 已损坏的素材 */
  var pressed = null, dragging = false, samples = [];
  var rafId = 0, theaterT = 0, sleepT = 0, wakeT = 0, bubbleT = 0, clickFlip = 0;
  var menu = null, lastClick = 0;
  var SIZE = 190, lastFloor = 0;

  /* ── 素材加载：blob URL 随取随播（fetch 顺路进 Service Worker 缓存）。
     常设 9 段在 pet/ 根；全库其余动作在 pet/all/（key=a###，见 manifest.json） ── */
  var MAN = null, manPromise = null;
  function loadManifest() {
    if (!manPromise) manPromise = fetch(DIR + "manifest.json").then(function (r) { return r.json(); }).catch(function () { return null; });
    return manPromise;
  }
  function fetchAsset(name) {
    if (urls[name] || dead[name]) return Promise.resolve(urls[name]);
    return fetch(DIR + (ASSETS[name] || "all/" + name + ".webm"))
      .then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.blob();
      })
      .then(function (b) {
        urls[name] = URL.createObjectURL(b);
        return urls[name];
      })
      .catch(function () { dead[name] = 1; return null; });
  }

  function play(name) {
    if (cur === name && !vid.ended) return;
    var u = urls[name];
    if (!u) { fetchAsset(name); return; }        /* 素材未就绪：这次先不切，下次触发再上 */
    cur = name;
    vid.loop = !!LOOPS[name];
    vid.src = u;
    vid.play().catch(function () {});
  }

  /* ── 气泡：长文本自动换行；伸出屏幕左右时用 margin 平移收回（不干扰 transform 过渡） ── */
  function say(pool) {
    if (!pool || !pool.length) return;
    bub.textContent = pick(pool);
    bub.classList.add("show");
    bub.classList.toggle("under", y < 150);
    bub.style.marginLeft = "";
    var br = bub.getBoundingClientRect();
    var dx = 0;
    if (br.left < 8) dx = 8 - br.left;
    if (br.right > innerWidth - 8) dx -= br.right - (innerWidth - 8);
    if (dx) bub.style.marginLeft = dx.toFixed(0) + "px";
    clearTimeout(bubbleT);
    bubbleT = setTimeout(function () { bub.classList.remove("show"); }, 2600);
  }

  /* ── 定时器编排：小剧场 18~40s 一场；空闲 240s 入睡；睡 50s 自己醒 ── */
  function armTheater() {
    clearTimeout(theaterT);
    theaterT = setTimeout(function () {
      if (cur !== "idle" || pressed || document.hidden) return;
      var pool = THEATER.filter(function (n) { return !dead[n] && urls[n]; });
      if (!pool.length) { armTheater(); return; }
      play(pick(pool));
      if (Math.random() < 0.6) say(LINES[cur]);
    }, 18000 + Math.random() * 22000);
  }
  function armSleep() {
    clearTimeout(sleepT);
    sleepT = setTimeout(function () {
      if (pressed || cur === "sleep") return;
      play("sleep");
      say(LINES.sleep);
      wakeT = setTimeout(function () { if (cur === "sleep") play("idle"); }, 50000);
    }, 240000);
  }

  /* ── 甩飞物理：重力 + 边缘反弹 + 落地摩擦，转速随水平速度 ── */
  function fly(vx, vy) {
    cancelAnimationFrame(rafId);
    var last = performance.now();
    function step(now) {
      var dt = clamp((now - last) / 1000, 0, 0.04);
      last = now;
      vy += 2200 * dt;
      x += vx * dt; y += vy * dt;
      var maxX = innerWidth - SIZE, maxY = floorY();
      if (x < 0) { x = 0; vx = -vx * 0.55; }
      if (x > maxX) { x = maxX; vx = -vx * 0.55; }
      if (y > maxY) {
        y = maxY;
        if (Math.abs(vy) < 90) { vy = 0; } else { vy = -vy * 0.55; }
      }
      if (y < 0) { y = 0; vy = -vy * 0.55; }
      if (vy === 0) vx *= Math.exp(-2.2 * dt);
      place();
      vid.style.transform = "rotate(" + clamp(vx * 0.012, -26, 26).toFixed(1) + "deg)";
      if (vy === 0 && Math.abs(vx) < 70) {         /* 停稳：回待机 */
        vid.style.transform = "";
        play("idle");
        armTheater();
        return;
      }
      rafId = requestAnimationFrame(step);
    }
    rafId = requestAnimationFrame(step);
  }

  /* ── 地板：贴底 12/18px 内边距 ── */
  function floorY() {
    var inset = innerWidth <= 640 ? 12 : 18;
    return Math.max(0, innerHeight - SIZE - inset);
  }

  function place() {
    var f = floorY();
    x = clamp(x, 0, Math.max(0, innerWidth - SIZE));
    y = clamp(y, 0, f);
    lastFloor = f;
    box.style.left = x + "px";
    box.style.top = y + "px";
  }

  /* ── 交互：拖拽 / 点击互动 · 双击呼出点播台 ── */
  function bindPointer() {
    box.addEventListener("pointerdown", function (e) {
      if (e.button > 0) return;
      e.preventDefault();
      try { box.setPointerCapture(e.pointerId); } catch (err) {} /* 个别环境对非活动指针会抛错 */
      cancelAnimationFrame(rafId);
      vid.style.transform = "";
      pressed = { t: performance.now(), x: e.clientX, y: e.clientY };
      dragging = false;
      samples = [{ t: pressed.t, x: e.clientX, y: e.clientY }];
      box.classList.add("grabbing");
      clearTimeout(sleepT); clearTimeout(wakeT);
      if (menu) closeMenu();
      if (cur === "sleep") { play("idle"); say(LINES.wake); }
      armSleep();
    });
    box.addEventListener("pointermove", function (e) {
      if (!pressed) return;
      var dx = e.clientX - pressed.x, dy = e.clientY - pressed.y;
      if (!dragging && Math.hypot(dx, dy) > 7) {
        dragging = true;
        play("drag");
        if (Math.random() < 0.5) say(LINES.grab);
      }
      if (!dragging) return;
      x = e.clientX - SIZE / 2; y = e.clientY - SIZE / 2;
      place();
      samples.push({ t: performance.now(), x: e.clientX, y: e.clientY });
      if (samples.length > 8) samples.shift();
    });
    function release(e) {
      if (!pressed) return;
      pressed = null;
      box.classList.remove("grabbing");
      if (!dragging) {
        clickAction();
        return;
      }
      /* 由最近 ~100ms 采样估算出手速度 */
      var old = samples[0] || { t: performance.now(), x: e.clientX, y: e.clientY };
      var span = Math.max(16, performance.now() - old.t) / 1000;
      var vx = (e.clientX - old.x) / span, vy = (e.clientY - old.y) / span;
      var sp = Math.hypot(vx, vy);
      if (sp > 2600) { vx *= 2600 / sp; vy *= 2600 / sp; }
      if (Math.hypot(vx, vy) > 420) {
        say(LINES.fly);
        fly(vx, vy);
      } else {
        vid.style.transform = "";
        play("idle");
        armTheater();
      }
      armSleep();
    }
    box.addEventListener("pointerup", release);
    box.addEventListener("pointercancel", release);
    /* 右键 / 安卓长按呼出系统菜单 → 拦下，开点播台 */
    box.addEventListener("contextmenu", function (e) {
      e.preventDefault();
      openMenu();
    });
  }

  var pokeCount = 0;
  function clickAction() {
    if (++pokeCount >= 10 && window.ACH) ACH.unlock("pet");
    var now = performance.now();
    if (now - lastClick < 500) { lastClick = 0; openMenu(); return; }  /* 双击：呼出点播台 */
    lastClick = now;
    clickFlip ^= 1;
    play(dead[clickFlip ? "happy" : "angry"] ? "idle" : clickFlip ? "happy" : "angry");
    say(LINES.click);
    armTheater();
  }

  /* ── 🎬 点播台：长按 / 右键呼出，点播任意已收录动作 ── */
  function closeMenu() {
    if (menu) { menu.remove(); menu = null; }
  }
  function openMenu() {
    if (menu) { closeMenu(); return; }
    lastClick = 0;
    menu = document.createElement("div");
    menu.className = "wp-menu";
    var h = document.createElement("h5");
    h.textContent = "🐋 鲸鲸点播台";
    var tabs = document.createElement("div");
    tabs.className = "wp-tabs";
    var panel = document.createElement("div");
    panel.className = "wp-panel";
    var foot = document.createElement("div");
    foot.className = "wp-foot";
    menu.appendChild(h);
    menu.appendChild(tabs);
    menu.appendChild(panel);
    menu.appendChild(foot);

    function actBtn(label, fn) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.addEventListener("click", function (e) { e.stopPropagation(); fn(b); });
      return b;
    }
    function runAct(k) {
      closeMenu();
      clearTimeout(wakeT);
      if (k === "sleep") {
        play("sleep");
        wakeT = setTimeout(function () { if (cur === "sleep") play("idle"); }, 50000);
      } else {
        play(k);
        armTheater();
      }
      if (LINES[k]) say(LINES[k]);
    }

    /* ⭐ 常设：精选动作（素材常驻，点了就播） */
    var CURATED = [
      ["liondance", "🦁 舞狮头"], ["code", "⌨️ 写代码"], ["tanghulu", "🍡 吃糖葫芦"],
      ["sigh", "😰 叹口气"], ["happy", "👋 开心挥手"],
      ["angry", "😤 傲娇生气"], ["sleep", "💤 睡一会儿"]
    ];
    function renderCurated() {
      panel.innerHTML = "";
      CURATED.forEach(function (a) {
        panel.appendChild(actBtn(a[1], function () { runAct(a[0]); }));
      });
    }
    /* 全库分类：manifest 驱动，首次点播按需拉取（拉过即缓存） */
    function renderCat(catId) {
      panel.innerHTML = "";
      MAN.acts.filter(function (a) { return a.c === catId; }).forEach(function (a) {
        panel.appendChild(actBtn(a.n, function (btn) {
          if (urls[a.k]) { runAct(a.k); return; }
          var old = btn.textContent;
          btn.textContent = "⏳ 加载中…";
          btn.disabled = true;
          fetchAsset(a.k).then(function (u) {
            btn.textContent = old;
            btn.disabled = false;
            if (u) runAct(a.k);
            else { closeMenu(); say(["这段素材走丢了……"]); }
          });
        }));
      });
    }
    function selectTab(btn, catId) {
      Array.prototype.forEach.call(tabs.children, function (b) { b.classList.toggle("on", b === btn); });
      if (catId === null) renderCurated();
      else if (MAN) renderCat(catId);
    }
    var curTab = actBtn("⭐ 常设", function () { selectTab(curTab, null); });
    curTab.classList.add("on");
    tabs.appendChild(curTab);
    renderCurated();
    /* manifest 懒加载：到手后把全库分类标签补上（97 段全收录） */
    loadManifest().then(function (m) {
      if (!m || !menu) return;
      MAN = m;
      m.cats.forEach(function (c) {
        var b = actBtn(c.name, function () { selectTab(b, c.id); });
        tabs.appendChild(b);
      });
      fitMenu(); /* 标签换行会撑高菜单，重新收回视口 */
    });

    foot.appendChild(actBtn("🏠 回原位", function () { closeMenu(); goHome(); }));
    foot.appendChild(actBtn("🚪 打卡下班", function () { closeMenu(); bye(); }));
    /* 菜单内部按压不落到宠物（不触发拖拽） */
    menu.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
    box.appendChild(menu);
    fitMenu();
  }
  /* 菜单收回视口：水平 margin 平移 + 顶部不足时动态收缩滚动面板 */
  function fitMenu() {
    if (!menu) return;
    menu.style.marginLeft = "";
    menu.style.position = ""; menu.style.top = ""; menu.style.bottom = ""; menu.style.left = ""; menu.style.transform = "";
    menu.classList.remove("under");
    var p2 = menu.querySelector(".wp-panel");
    if (p2) p2.style.maxHeight = "";
    var mr = menu.getBoundingClientRect();
    /* 上方放不下时的三级策略：微差压面板 → 身下放得下才翻下 → 钉屏 */
    if (mr.top < 8) {
      var petR = box.getBoundingClientRect();
      var underFits = (petR.bottom + 12 + mr.height) <= (innerHeight - 8);
      if (mr.top >= -110 && p2) {
        var shrink = p2.clientHeight + (mr.top - 8);
        if (shrink > 120) p2.style.maxHeight = shrink + "px";
      } else if (underFits) {
        menu.classList.add("under");
      }
    }
    mr = menu.getBoundingClientRect();
    var dx = 0;
    if (mr.left < 8) dx = 8 - mr.left;
    if (mr.right > innerWidth - 8) dx -= mr.right - (innerWidth - 8);
    if (dx) menu.style.marginLeft = dx.toFixed(0) + "px";
    /* 终极兜底：脱离锚定钉在屏内，面板压缩到装得下为止 */
    for (var i = 0; i < 3; i++) {
      var mr2 = menu.getBoundingClientRect();
      if (mr2.top >= 8 && mr2.bottom <= innerHeight - 4) break;
      if (mr2.top < 8) {
        menu.style.marginLeft = "";
        menu.style.position = "fixed";
        menu.style.left = Math.max(8, Math.min(mr2.left, innerWidth - mr2.width - 8)) + "px";
        menu.style.top = "8px";
        menu.style.bottom = "auto";
        menu.style.transform = "none";
      }
      var mb = menu.getBoundingClientRect().bottom;
      if (p2 && mb > innerHeight - 8) {
        p2.style.maxHeight = Math.max(120, p2.clientHeight - (mb - (innerHeight - 8))) + "px";
      }
    }
  }
  /* 调试钩子：验收用，可手动重跑适配 */
  try { window.__wpFit = function () { fitMenu(); }; } catch (e) {}
  function goHome() {
    box.classList.add("homing");
    x = innerWidth <= 640 ? 12 : 18;
    y = floorY();
    place();
    setTimeout(function () { box.classList.remove("homing"); }, 620);
    say(["到家！"]);
  }

  function bye() {
    say(LINES.bye);
    try { sessionStorage.setItem("pet-off", "1"); } catch (e) {}
    box.classList.add("leaving");
    setTimeout(function () { teardown(); showSummon(); }, 900);
  }

  /* ── 🐋 召唤铃：下班后左下角留个门铃，一键召回（比刷新页友好） ── */
  function showSummon() {
    var old = document.getElementById("petSummon");
    if (old) old.remove();
    var b = document.createElement("button");
    b.id = "petSummon";
    b.type = "button";
    b.title = "召唤鲸鲸回来上班";
    b.setAttribute("aria-label", "召唤鲸鲸回来上班");
    b.textContent = "🐋";
    if (window.ACH) ACH.unlock("petbye");
    b.addEventListener("click", function () {
      try { sessionStorage.removeItem("pet-off"); } catch (e) {}
      b.remove();
      cur = ""; pressed = null; dragging = false; menu = null; rafId = 0;
      clearTimeout(theaterT); clearTimeout(sleepT); clearTimeout(wakeT); clearTimeout(bubbleT);
      init();
    });
    document.body.appendChild(b);
  }

  function teardown() {
    clearTimeout(theaterT); clearTimeout(sleepT); clearTimeout(wakeT); clearTimeout(bubbleT);
    closeMenu();
    cancelAnimationFrame(rafId);
    if (box) box.remove();
  }

  /* ── 样式自注入（不占用站内 css 版本号） ── */
  function injectStyle() {
    if (document.getElementById("wpStyle")) return;
    var s = document.createElement("style");
    s.id = "wpStyle";
    s.textContent =
      "#webPet{position:fixed;left:18px;bottom:18px;width:clamp(225px,30vw,460px);height:clamp(225px,30vw,460px);z-index:1450;" +
      "cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none;" +
      "-webkit-tap-highlight-color:transparent;-webkit-touch-callout:none;outline:none;" +
      "transition:opacity .8s,transform .8s}" +
      "#webPet.grabbing{cursor:grabbing}" +
      "#webPet.homing{transition:opacity .8s,transform .8s,left .55s cubic-bezier(.22,1,.36,1),top .55s cubic-bezier(.22,1,.36,1)}" +
      "#webPet.leaving{opacity:0;transform:translateY(26px) rotate(8deg)}" +
      "#webPet video{width:100%;height:100%;object-fit:contain;display:block;pointer-events:none;" +
      "filter:drop-shadow(0 8px 16px rgba(0,0,0,.38))}" + /* 阴影挂视频上：不给孩子当 fixed 的包含块 */
      "#webPet video::-webkit-media-controls-overlay-play-button{display:none!important;-webkit-appearance:none}" +
      "#webPet video::-webkit-media-controls-start-playback-button{display:none!important;-webkit-appearance:none}" +
      "#webPet .wp-bubble{position:absolute;bottom:calc(100% + 10px);left:50%;transform:translateX(-50%) translateY(6px);" +
      "width:max-content;max-width:min(280px,64vw);padding:7px 12px;border-radius:13px;font-size:clamp(13px,1.15vw,15px);line-height:1.55;text-align:center;" +
      "background:rgba(8,14,12,.92);color:#eafff6;border:1px solid var(--accent,#00e5a0);" +
      "backdrop-filter:blur(6px);opacity:0;pointer-events:none;transition:opacity .25s,transform .25s}" +
      "#webPet .wp-bubble.show{opacity:1;transform:translateX(-50%) translateY(0)}" +
      "#webPet .wp-bubble.under{bottom:auto;top:calc(100% + 10px)}" +
      "#webPet .wp-menu{position:absolute;bottom:calc(100% + 12px);left:50%;transform:translateX(-50%);" +
      "width:max-content;max-width:min(360px,92vw);padding:10px 12px;border-radius:14px;" +
      "background:rgba(8,14,12,.94);color:#eafff6;border:1px solid var(--accent,#00e5a0);" +
      "backdrop-filter:blur(8px);display:flex;flex-direction:column;gap:8px;" +
      "animation:wpMenuIn .18s ease-out;z-index:6}" +
      "#webPet .wp-menu.under{bottom:auto;top:calc(100% + 12px)}" +
      "#webPet .wp-menu h5{margin:0;font-size:12px;color:var(--accent,#00e5a0);font-weight:600;letter-spacing:.5px}" +
      "#webPet .wp-tabs{display:flex;flex-wrap:wrap;gap:5px}" +
      "#webPet .wp-tabs button{padding:4px 9px;font-size:12px;border-radius:99px}" +
      "#webPet .wp-tabs button.on{background:var(--accent,#00e5a0);color:#06120e;border-color:transparent;font-weight:600}" +
      "#webPet .wp-panel{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;" +
      "max-height:min(280px,40vh);overflow-y:auto;padding-right:2px;overscroll-behavior:contain}" +
      "#webPet .wp-panel button{text-overflow:ellipsis;overflow:hidden}" +
      "#webPet .wp-foot{display:grid;grid-template-columns:1fr 1fr;gap:6px}" +
      "#webPet .wp-menu button{appearance:none;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);" +
      "color:#eafff6;border-radius:9px;padding:7px 10px;font-size:13px;cursor:pointer;white-space:nowrap;" +
      "-webkit-tap-highlight-color:transparent;font-family:inherit}" +
      "#webPet .wp-menu button:hover{background:rgba(255,255,255,.14);border-color:var(--accent,#00e5a0)}" +
      "@keyframes wpMenuIn{from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}" +
      "#petSummon{position:fixed;left:18px;bottom:18px;z-index:1449;width:48px;height:48px;border-radius:50%;" +
      "border:1px solid var(--accent,#00e5a0);background:rgba(8,14,12,.88);backdrop-filter:blur(6px);color:#eafff6;" +
      "font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;" +
      "-webkit-tap-highlight-color:transparent;animation:wpPulse 2.4s infinite}" +
      "@keyframes wpPulse{0%,100%{box-shadow:0 0 0 0 rgba(0,229,160,.4)}50%{box-shadow:0 0 0 12px rgba(0,229,160,0)}}" +
      "@media(max-width:640px){#webPet{left:12px;bottom:12px}#petSummon{left:12px;bottom:12px;width:44px;height:44px}}" +
      "@media print{#webPet{display:none}}" +
      "@media(prefers-reduced-motion:reduce){#petSummon{animation:none}}";
    document.head.appendChild(s);
  }

  function init() {
    var sb = document.getElementById("petSummon");
    if (sb) sb.remove();
    cur = ""; pressed = null; dragging = false; menu = null; rafId = 0;
    injectStyle();

    box = document.createElement("div");
    box.id = "webPet";
    box.title = "鲸鲸 · 点击互动 / 拖拽甩飞 · 双击或右键开点播台 · 素材来自 dsh-pet（MIT）";
    box.setAttribute("aria-hidden", "true");
    bub = document.createElement("div");
    bub.className = "wp-bubble";
    vid = document.createElement("video");
    vid.muted = true;
    vid.autoplay = true;
    vid.setAttribute("playsinline", "");
    vid.setAttribute("disablepictureinpicture", "");
    vid.controls = false;
    vid.setAttribute("controlslist", "noplaybackrate nodownload nomute");
    vid.poster = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"; /* 1px 透明：防 WebView 画默认占位播放键 */
    vid.setAttribute("aria-hidden", "true");
    box.appendChild(bub);
    box.appendChild(vid);
    document.body.appendChild(box);

    vid.addEventListener("ended", function () {
      if (cur !== "idle") { play("idle"); armTheater(); }
    });
    vid.addEventListener("error", function () {
      if (cur === "idle" || !urls.idle) { teardown(); return; }  /* 起步素材都挂了：整体退场 */
      dead[cur] = 1;
      play("idle");
    });

    SIZE = box.offsetWidth || 225;
    x = box.offsetLeft;   /* 尊重媒体查询的手机内边距 */
    y = floorY();         /* 站上地板 */
    place();
    bindPointer();
    armSleep();

    fetchAsset("idle").then(function (u) {
      if (!u) { teardown(); return; }
      play("idle");
      armTheater();
      if (Math.random() < 0.5) setTimeout(function () { say(LINES.hello); }, 1400);
      /* 其余素材页面空闲后再串行预取，正式互动零等待 */
      setTimeout(function () {
        var conn = navigator.connection || {};
        if (conn.saveData || /2g/.test(conn.effectiveType || "")) return;
        Object.keys(ASSETS).reduce(function (p, n) {
          return p.then(function () { return fetchAsset(n); });
        }, Promise.resolve());
      }, 3200);
    });

    /* 用户在页面里有动静就别睡死（顺带救活被后台策略暂停的视频）；点宠物外任意处收起点播台 */
    document.addEventListener("pointerdown", function (e) {
      if (menu && !box.contains(e.target)) closeMenu();
      if (vid && vid.paused && vid.src) vid.play().catch(function () {});
      clearTimeout(sleepT);
      armSleep();
    }, { passive: true });
    document.addEventListener("keydown", function () { clearTimeout(sleepT); armSleep(); }, { passive: true });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        vid.pause();
        clearTimeout(theaterT);
      } else {
        vid.play().catch(function () {});
        if (cur === "idle") armTheater();
      }
    });
    /* 尺寸随视口流式变化（clamp）：ResizeObserver 盯自身尺寸 + resize 事件双保险，
       窗口一变就重读尺寸并收回视口内（部分内嵌视图改视口不派发 resize 事件） */
    function refit() {
      var wasOnFloor = !pressed && Math.abs(y - lastFloor) < 2;
      SIZE = box.offsetWidth || SIZE;
      var newFloor = floorY();
      if (wasOnFloor || y > newFloor) y = newFloor;
      place();
    }
    if (window.ResizeObserver) new ResizeObserver(refit).observe(box);
    addEventListener("resize", refit);

    try { console.info("🐋 鲸鲸 · 形象与动画素材来自 PC2005-cloud/dsh-pet（MIT License）"); } catch (e) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
