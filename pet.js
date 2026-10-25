/* ═══════ 🐋 网页宠物 · 鲸鲸 ═══════
   鲸鲸形象与动画素材来自开源项目 dsh-pet（PC2005-cloud，MIT License），
   精选 8 段 VP9 透明 webm（共约 3.1MB），存放在 /pet/ 目录。
   行为：待机呼吸 → 随机小剧场 → 点击互动 / 拖拽甩飞反弹 / 久置入睡 / 双击下班。
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
    tanghulu: "tanghulu.webm", sigh: "sigh.webm"
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
    bye: ["打卡下班，明天见～"],
    code: ["这行代码我也看不懂，但大受震撼", "别催了，在写了在写了"],
    tanghulu: ["冰糖葫芦，酸掉牙但快乐", "甜的酸的，都是生活"],
    sigh: ["需求又变了……哦，这儿没甲方", "叹气专用动画，按次计费"]
  };
  function pick(a) { return a[(Math.random() * a.length) | 0]; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  var box, vid, bub;                 /* 容器 / 视频 / 气泡 */
  var x = 18, y = 0;                 /* 容器左上角坐标 */
  var cur = "";                      /* 当前播放的状态名 */
  var urls = {}, dead = {};          /* 已就绪 blob URL / 已损坏的素材 */
  var pressed = null, dragging = false, samples = [];
  var rafId = 0, theaterT = 0, sleepT = 0, wakeT = 0, bubbleT = 0, clickFlip = 0, lastClick = 0;
  var SIZE = 112;

  /* ── 素材加载：blob URL 随取随播（fetch 顺路进 Service Worker 缓存） ── */
  function fetchAsset(name) {
    if (urls[name] || dead[name]) return Promise.resolve(urls[name]);
    return fetch(DIR + ASSETS[name])
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

  /* ── 气泡 ── */
  function say(pool) {
    if (!pool || !pool.length) return;
    bub.textContent = pick(pool);
    bub.classList.add("show");
    bub.classList.toggle("under", y < 96);       /* 贴着屏幕顶时气泡挪到身下 */
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
      var maxX = innerWidth - SIZE, maxY = innerHeight - SIZE;
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

  function place() {
    x = clamp(x, 0, Math.max(0, innerWidth - SIZE));
    y = clamp(y, 0, Math.max(0, innerHeight - SIZE));
    box.style.left = x + "px";
    box.style.top = y + "px";
  }

  /* ── 交互：拖拽 / 点击（连点两下 = 打卡下班） ── */
  function bindPointer() {
    box.addEventListener("pointerdown", function (e) {
      if (e.button > 0) return;
      e.preventDefault();
      box.setPointerCapture(e.pointerId);
      cancelAnimationFrame(rafId);
      vid.style.transform = "";
      pressed = { t: performance.now(), x: e.clientX, y: e.clientY };
      dragging = false;
      samples = [{ t: pressed.t, x: e.clientX, y: e.clientY }];
      box.classList.add("grabbing");
      clearTimeout(sleepT); clearTimeout(wakeT);
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
      var dt = performance.now() - pressed.t;
      pressed = null;
      box.classList.remove("grabbing");
      if (!dragging) {
        if (dt < 400) clickAction();
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
  }

  function clickAction() {
    var now = performance.now();
    if (now - lastClick < 500) { bye(); return; }   /* 双击（按系统双击时限）：下班 */
    lastClick = now;
    clickFlip ^= 1;
    play(dead[clickFlip ? "happy" : "angry"] ? "idle" : clickFlip ? "happy" : "angry");
    say(LINES.click);
    armTheater();
  }

  function bye() {
    say(LINES.bye);
    try { sessionStorage.setItem("pet-off", "1"); } catch (e) {}
    box.classList.add("leaving");
    setTimeout(function () { teardown(); }, 900);
  }

  function teardown() {
    clearTimeout(theaterT); clearTimeout(sleepT); clearTimeout(wakeT); clearTimeout(bubbleT);
    cancelAnimationFrame(rafId);
    if (box) box.remove();
  }

  /* ── 样式自注入（不占用站内 css 版本号） ── */
  function injectStyle() {
    var s = document.createElement("style");
    s.textContent =
      "#webPet{position:fixed;left:18px;bottom:18px;width:112px;height:112px;z-index:880;" +
      "cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none;" +
      "filter:drop-shadow(0 8px 16px rgba(0,0,0,.38));transition:opacity .8s,transform .8s}" +
      "#webPet.grabbing{cursor:grabbing}" +
      "#webPet.leaving{opacity:0;transform:translateY(26px) rotate(8deg)}" +
      "#webPet video{width:100%;height:100%;object-fit:contain;display:block;pointer-events:none}" +
      "#webPet .wp-bubble{position:absolute;bottom:calc(100% + 10px);left:50%;transform:translateX(-50%) translateY(6px);" +
      "max-width:190px;padding:6px 11px;border-radius:12px;font-size:12px;line-height:1.5;text-align:center;" +
      "white-space:nowrap;background:rgba(8,14,12,.92);color:#eafff6;border:1px solid var(--accent,#00e5a0);" +
      "backdrop-filter:blur(6px);opacity:0;pointer-events:none;transition:opacity .25s,transform .25s}" +
      "#webPet .wp-bubble.show{opacity:1;transform:translateX(-50%) translateY(0)}" +
      "#webPet .wp-bubble.under{bottom:auto;top:calc(100% + 10px)}" +
      "@media(max-width:640px){#webPet{width:78px;height:78px;left:12px;bottom:12px}}" +
      "@media print{#webPet{display:none}}";
    document.head.appendChild(s);
  }

  function init() {
    injectStyle();

    box = document.createElement("div");
    box.id = "webPet";
    box.title = "鲸鲸 · 可以拖我甩我 · 双击让我下班（刷新回来）· 素材来自 dsh-pet（MIT）";
    box.setAttribute("aria-hidden", "true");
    bub = document.createElement("div");
    bub.className = "wp-bubble";
    vid = document.createElement("video");
    vid.muted = true;
    vid.autoplay = true;
    vid.setAttribute("playsinline", "");
    vid.setAttribute("disablepictureinpicture", "");
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

    SIZE = box.offsetWidth || 112;
    y = innerHeight - SIZE - 18;
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

    /* 用户在页面里有动静就别睡死；离开标签页时暂停一切 */
    document.addEventListener("pointerdown", function () { clearTimeout(sleepT); armSleep(); }, { passive: true });
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
    addEventListener("resize", place);

    try { console.info("🐋 鲸鲸 · 形象与动画素材来自 PC2005-cloud/dsh-pet（MIT License）"); } catch (e) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
