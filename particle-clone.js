/* ═══ 🎴 看板娘粒子分身（v208 重构） ═══
   取 pet/ 常驻视频的真实帧，只按「角色本体」的 alpha 轮廓采样，
   再由 rAF 驱动成粒子。相比旧版：找回被背景装饰撑大的包围盒、
   保留半透明边缘层次、按颜色/透明度分桶批量绘制、视口外暂停。 */
(function () {
  "use strict";

  var strip = document.getElementById("petStrip");
  if (!strip) return;

  /* 预生成的静态帧（28~32KB/张），比 440KB 的视频快一个量级 */
  var POSES = [
    { file: "idle.webp",        name: "发呆",   hold: 13000, line: "我在这儿站了很久了，你终于滑到我了。" },
    { file: "code.webp",        name: "敲代码", hold: 11000, line: "又在改 CSS？这次一定能对齐。" },
    { file: "click-happy.webp", name: "开心",   hold: 9000,  line: "别戳了，我本来就是这个像素密度。" },
    { file: "liondance.webp",   name: "醒狮",   hold: 11000, line: "醒狮只是兼职，本职是当粒子。" },
    { file: "tanghulu.webp",    name: "糖葫芦", hold: 10000, line: "糖葫芦好吃，可糖衣会反光，粒子挡不住。" },
    { file: "sleep.webp",       name: "打盹",   hold: 10000, line: "夜深了，粒子也要睡……才怪。" }
  ];

  var reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var isMobile = !!(window.matchMedia && matchMedia("(max-width: 640px)").matches);

  var canvas = document.createElement("canvas");
  canvas.id = "petStripCanvas";
  canvas.setAttribute("aria-hidden", "true");
  strip.appendChild(canvas);

  var line = document.createElement("div");
  line.className = "ps-line";
  line.setAttribute("aria-live", "polite");
  strip.appendChild(line);

  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var sampleCanvas = document.createElement("canvas");
  var sampleCtx = sampleCanvas.getContext("2d", { willReadFrequently: true });

  var W = 0, H = 0;
  var parts = [];
  var groups = [];
  var frames = {};
  var poseIdx = 0;
  var poseAt = 0;
  var burstUntil = 0;
  var sayTimer = 0;
  var mouse = { x: -9999, y: -9999 };
  var accent = [77, 107, 254];
  var visible = true;
  var started = false;

  var stats = { parts: 0, groups: 0, pose: "", samples: 0, fps: 0 };
  window.__stripStats = stats;

  function getFrame(name) {
    var img = frames[name];
    if (!img) {
      img = new Image();
      img.src = "pet/frames/" + name;
      img.alt = "";
      frames[name] = img;
    }
    return img;
  }

  function fit() {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    W = strip.clientWidth;
    H = strip.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* ── 采样：核心包围盒 + 边缘分层 ── */
  function capture(img) {
    if (!img || !img.complete || !img.naturalWidth) return null;
    var vw = img.naturalWidth, vh = img.naturalHeight;
    if (sampleCanvas.width !== vw || sampleCanvas.height !== vh) {
      sampleCanvas.width = vw;
      sampleCanvas.height = vh;
    }
    sampleCtx.clearRect(0, 0, vw, vh);
    try { sampleCtx.drawImage(img, 0, 0, vw, vh); } catch (e) { return null; }
    var data;
    try { data = sampleCtx.getImageData(0, 0, vw, vh).data; } catch (e) { return null; }

    var total = vw * vh, checked = 0, opaque = 0, i;
    for (i = 3; i < data.length; i += 16) {
      checked++;
      if (data[i] > 200) opaque++;
    }
    /* 有 alpha 通道且主体不铺满 → 用 alpha；否则退化为亮度抠像 */
    var alphaOK = opaque > checked * 0.02 && opaque < checked * 0.9;
    var isSolid = function (j) {
      return alphaOK
        ? data[j + 3] > 200
        : (data[j] * 0.299 + data[j + 1] * 0.587 + data[j + 2] * 0.114) > 30;
    };

    var x0 = vw, y0 = vh, x1 = 0, y1 = 0, core = 0;
    for (var y = 0; y < vh; y += 3) {
      for (var x = 0; x < vw; x += 3) {
        var j = (y * vw + x) * 4;
        if (isSolid(j)) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
          core++;
        }
      }
    }
    if (core < 40) return null;
    var cw0 = x1 - x0, ch0 = y1 - y0;
    if (cw0 < 20 || ch0 < 20) return null;

    var padX = Math.max(2, cw0 * 0.05), padY = Math.max(2, ch0 * 0.05);
    x0 = Math.max(0, x0 - padX); x1 = Math.min(vw, x1 + padX);
    y0 = Math.max(0, y0 - padY); y1 = Math.min(vh, y1 + padY);
    var cw = x1 - x0, ch = y1 - y0;

    /* 等比放进展示带，角色本体占高约 78% */
    var targetH = H * (isMobile ? 0.76 : 0.78);
    var sc = targetH / ch;
    var maxW = W * 0.86;
    if (cw * sc > maxW) sc = maxW / cw;
    var drawW = cw * sc, drawH = ch * sc;
    var ox = (W - drawW) / 2 - x0 * sc;
    var oy = H * 0.54 - drawH / 2 - y0 * sc;

    var budget = isMobile ? 3400 : 6200;
    var headY = y0 + ch * 0.52;
    var mask = new Uint8Array(vw * vh);
    var next = [];

    /* 透明视频的 RGB 常常是预乘过的：除以 alpha 还原本色；暗部只轻提，保住五官对比 */
    function tone(c, a) {
      if (alphaOK && a > 0.25 && a < 0.98) c = c / a;
      c = (c - 128) * 1.12 + 134;
      return c < 0 ? 0 : c > 255 ? 255 : Math.round(c);
    }

    function scan(yStart, yEnd, stepArg, limit) {
      for (var sy = yStart; sy < yEnd; ) {
        var step = Math.max(1, Math.round(typeof stepArg === 'function' ? stepArg(sy) : stepArg));
        for (var sx = x0; sx < x1; sx += step) {
          if (limit && next.length >= limit) return;
          var px = sx | 0, py = sy | 0, key = py * vw + px;
          if (mask[key]) continue;
          var j2 = key * 4;
          var a = alphaOK ? data[j2 + 3] / 255 : (isSolid(j2) ? 1 : 0);
          if (a < (alphaOK ? 0.07 : 0.01)) continue;
          mask[key] = 1;
          var r = tone(data[j2], a);
          var g = tone(data[j2 + 1], a);
          var b = tone(data[j2 + 2], a);
          var jx = step < 2 ? 0 : (Math.random() - 0.5) * step * 0.14;
          var jy = step < 2 ? 0 : (Math.random() - 0.5) * step * 0.22;
          var rad = Math.max(0.95, step * sc * 0.68);
          next.push({
            x: ox + (sx + jx) * sc,
            y: oy + (sy + jy) * sc,
            r: rad * (a > 0.72 ? 1.04 : a > 0.4 ? 0.96 : 0.86),
            a: a > 0.72 ? 1 : a > 0.4 ? 0.9 : 0.6,
            col: r + "," + g + "," + b,
            glow: a <= 0.4
          });
        }
        sy += step;
      }
    }

    /* 全身统一 2px 细采：不再分头部/身体，密度自始至终一致 */
    scan(y0, y1, 2, 0);

    /* 第三轮：按梯度挑选边缘像素，优先保住眼睛、嘴、发饰这些高频细节 */
    function lum(j) { return data[j] * 0.299 + data[j + 1] * 0.587 + data[j + 2] * 0.114; }
    var cand = [];
    for (var ey = y0 | 0; ey < y1; ey += 1) {
      for (var ex = x0 | 0; ex < x1; ex += 1) {
        var key = ey * vw + ex;
        if (mask[key]) continue;
        var j3 = key * 4;
        var a3 = alphaOK ? data[j3 + 3] / 255 : (isSolid(j3) ? 1 : 0);
        if (a3 < 0.3) continue;
        var l0 = lum(j3);
        var lx = ex < vw - 1 ? lum(j3 + 4) : l0;
        var ly = ey < vh - 1 ? lum(j3 + vw * 4) : l0;
        var ax = ex < vw - 1 ? data[j3 + 7] : data[j3 + 3];
        var ay = ey < vh - 1 ? data[j3 + 3 + vw * 4] : data[j3 + 3];
        var diff = Math.abs(l0 - lx) + Math.abs(l0 - ly) +
                   (Math.abs(data[j3 + 3] - ax) + Math.abs(data[j3 + 3] - ay)) * 0.3;
        if (diff < 28) continue;
        cand.push({ k: key, x: ex, y: ey, j: j3, d: diff, a: a3 });
      }
    }
    cand.sort(function (m, n) { return n.d - m.d; });
    var edgeN = Math.min(isMobile ? 1800 : 3200, cand.length);
    for (var ci = 0; ci < edgeN; ci++) {
      var c = cand[ci];
      /* 高光边缘（发饰、眼睛高光、裙边）再提一档，勾出亮线 */
      var hi = lum(c.j) > 196;
      var cr = tone(data[c.j], c.a);
      var cg = tone(data[c.j + 1], c.a);
      var cb = tone(data[c.j + 2], c.a);
      if (hi) { cr = Math.min(255, cr + 26); cg = Math.min(255, cg + 26); cb = Math.min(255, cb + 26); }
      next.push({
        x: ox + c.x * sc,
        y: oy + c.y * sc,
        r: Math.max(1, sc * (hi ? 1.12 : 1.04)),
        a: 1,
        col: cr + "," + cg + "," + cb,
        glow: false,
        edge: true
      });
    }
    /* 第四轮：脸部高亮区再加密一倍，让五官有足够的点可以落 */
    var faceCap = isMobile ? 700 : 1400, faceN = 0;
    var faceTop = (y0 + ch * 0.08) | 0, faceBottom = (y0 + ch * 0.46) | 0;
    for (var fy = faceTop; fy < faceBottom && faceN < faceCap; fy += 1) {
      for (var fx = x0 | 0; fx < x1 && faceN < faceCap; fx += 1) {
        var fk = fy * vw + fx;
        if (mask[fk]) continue;
        var fj = fk * 4;
        var fa = alphaOK ? data[fj + 3] / 255 : 1;
        if (fa < 0.8) continue;
        if (lum(fj) < 140) continue;
        mask[fk] = 1;
        faceN++;
        next.push({
          x: ox + fx * sc,
          y: oy + fy * sc,
          r: Math.max(0.95, sc * 1.02),
          a: 1,
          col: tone(data[fj], fa) + ',' + tone(data[fj + 1], fa) + ',' + tone(data[fj + 2], fa),
          glow: false
        });
      }
    }
    if (!next.length) return null;

    var cap = Math.round(budget * 3.4);
    if (next.length > cap) {
      /* 抽稀时优先保住边缘点，否则轮廓又被抹平 */
      var edges = [], rest = [], ei;
      for (ei = 0; ei < next.length; ei++) (next[ei].edge ? edges : rest).push(next[ei]);
      if (edges.length >= cap) {
        var keepE = [], stpE = edges.length / cap;
        for (var ke = 0; ke < cap; ke++) keepE.push(edges[(ke * stpE) | 0]);
        next = keepE;
      } else {
        var room = cap - edges.length, keepR = [], stpR = rest.length / room;
        for (var kr = 0; kr < room; kr++) keepR.push(rest[(kr * stpR) | 0]);
        next = edges.concat(keepR);
      }
    }
    stats.samples++;
    return next;
  }

  function quant(c) {
    var p = c.split(",");
    return ((+p[0] >> 4) << 4) + "," + ((+p[1] >> 4) << 4) + "," + ((+p[2] >> 4) << 4);
  }

  function blend(c, mix) {
    var p = c.split(","), q = mix;
    return (Math.round(+p[0] * (1 - q) + accent[0] * q)) + "," +
           (Math.round(+p[1] * (1 - q) + accent[1] * q)) + "," +
           (Math.round(+p[2] * (1 - q) + accent[2] * q));
  }

  function buildGroups() {
    var map = Object.create(null), list = [];
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      var col = quant(p.col);
      if (p.glow) col = blend(col, 0.12);
      var key = col + "|" + p.a;
      var g = map[key];
      if (!g) {
        g = map[key] = { col: col, a: p.a, glow: p.glow, items: [], lum: (function () { var q = col.split(','); return q[0] * 0.299 + q[1] * 0.587 + q[2] * 0.114; })() };
        list.push(g);
      }
      g.items.push(p);
    }
    list.sort(function (a, b) { return a.lum - b.lum; });
    groups = list;
    stats.groups = list.length;
    stats.accent = accent.join(",");
  }

  function sync(points, poseName) {
    points.sort(function (a, b) { return a.x - b.x; });
    var n = points.length;
    while (parts.length > n) parts.pop();
    while (parts.length < n) {
      parts.push({ x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, r: 1, a: 1, col: "", glow: false, delay: 0, start: 0, has: false });
    }
    var t0 = performance.now();
    for (var i = 0; i < n; i++) {
      var p = parts[i], t = points[i];
      if (!p.has) {
        p.x = t.x;
        p.y = t.y;
        p.has = true;
      }
      p.tx = t.x; p.ty = t.y;
      p.r = t.r; p.a = t.a; p.col = t.col; p.glow = t.glow;
      p.delay = reduce ? 0 : (i / n) * 0.5 + Math.random() * 0.18;
      p.start = t0;
      if (reduce) { p.x = t.x; p.y = t.y; p.vx = 0; p.vy = 0; }
    }
    buildGroups();
    stats.parts = n;
    stats.pose = poseName;
  }

  function thin(ratio) {
    var keep = [];
    for (var i = 0; i < parts.length; i++) {
      if (Math.random() > ratio) keep.push(parts[i]);
    }
    parts = keep;
    buildGroups();
    stats.parts = parts.length;
  }

  function say(text) {
    line.textContent = text;
    line.classList.add("show");
    clearTimeout(sayTimer);
    sayTimer = setTimeout(function () { line.classList.remove("show"); }, 3800);
  }

  function burst() {
    burstUntil = performance.now() + 1100;
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      var ang = Math.random() * Math.PI * 2;
      var sp = 110 + Math.random() * 340;
      p.vx += Math.cos(ang) * sp;
      p.vy += Math.sin(ang) * sp;
    }
  }

  function step(dt, now) {
    var t = now / 1000;
    var R = Math.max(90, Math.min(W, H) * 0.3);
    var R2 = R * R;
    var bursting = now < burstUntil;
    var k = bursting ? 5 : 34;
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      var tx = p.tx, ty = p.ty;
      if ((now - p.start) / 1000 < p.delay) { tx = p.x; ty = p.y; }

      p.vx += (tx - p.x) * k * dt;
      p.vy += (ty - p.y) * k * dt;

      var dx = p.x - mouse.x, dy = p.y - mouse.y;
      var d2 = dx * dx + dy * dy;
      if (d2 < R2 && d2 > 0.01) {
        var d = Math.sqrt(d2);
        var f = (1 - d / R) * 900 * dt;
        p.vx += (dx / d) * f;
        p.vy += (dy / d) * f;
      }

      var damp = Math.pow(0.12, dt);
      p.vx *= damp;
      p.vy *= damp;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      p.dx = Math.sin(t * 1.05 + i * 0.31) * 0.16;
      p.dy = Math.cos(t * 0.87 + i * 0.23) * 0.16;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    var i, k, g, p, items;
    ctx.globalCompositeOperation = "lighter";
    for (i = 0; i < groups.length; i++) {
      g = groups[i];
      if (!g.glow) continue;
      items = g.items;
      ctx.globalAlpha = 0.045;
      ctx.fillStyle = "rgb(" + g.col + ")";
      for (k = 0; k < items.length; k++) {
        p = items[k];
        ctx.fillRect(p.x + p.dx - p.r, p.y + p.dy - p.r, p.r * 1.6, p.r * 1.6);
      }
    }

    ctx.globalCompositeOperation = "source-over";
    for (i = 0; i < groups.length; i++) {
      g = groups[i];
      if (g.glow) continue;
      items = g.items;
      ctx.globalAlpha = g.a;
      ctx.fillStyle = "rgb(" + g.col + ")";
      for (k = 0; k < items.length; k++) {
        p = items[k];
        ctx.fillRect(Math.round((p.x + p.dx) * 2) / 2, Math.round((p.y + p.dy) * 2) / 2, p.r, p.r);
      }
    }
    ctx.globalAlpha = 1;
  }

  function usePose(img, name) {
    var got = capture(img);
    if (!got) return false;
    sync(got, name);
    return true;
  }

  /* 静态帧加载完直接采样：轮询图片状态，不依赖 decode() 的 Promise */
  function samplePose(img, name, line, after) {
    var done = false, attempts = 0;
    function finish(ok) {
      if (done) return;
      done = true;
      stats.img = img.complete ? img.naturalWidth : -1;
      var got = ok && usePose(img, name);
      if (got && line) say(line);
      if (after) after(got);
    }
    function attempt() {
      if (done) return;
      if (img.complete && img.naturalWidth > 0) { finish(true); return; }
      if (img.complete && img.naturalWidth === 0) { finish(false); return; }
      if (attempts++ > 70) { finish(false); return; }
      setTimeout(attempt, 140);
    }
    attempt();
  }

  function nextPose() {
    poseIdx = (poseIdx + 1) % POSES.length;
    var pose = POSES[poseIdx];
    poseAt = performance.now();
    samplePose(getFrame(pose.file), pose.name, pose.line);
  }

  var last = 0, fpsAcc = 0, fpsN = 0, degradeAt = 0, degradeN = 0;
  function loop(now) {
    requestAnimationFrame(loop);
    if (!visible || document.hidden) { last = now; return; }
    var dt = Math.min(0.05, (now - last) / 1000) || 0.016;
    last = now;
    step(dt, now);
    draw();
    fpsAcc += dt; fpsN++;
    if (fpsAcc > 1) { stats.fps = Math.round(fpsN / fpsAcc); fpsAcc = 0; fpsN = 0; }
    if (now - poseAt > POSES[poseIdx].hold) nextPose();

    /* 弱机保护：连续掉帧就分两档削粒子，避免整段动画卡住 */
    if (degradeN < 2 && stats.fps && stats.fps < 34 && parts.length > 5000) {
      if (!degradeAt) degradeAt = now;
      else if (now - degradeAt > 2500) { thin(0.18); degradeAt = 0; degradeN++; }
    } else if (stats.fps >= 40) {
      degradeAt = 0;
    }
  }

  function start() {
    if (started) return;
    started = true;
    requestAnimationFrame(function (now) { last = now; if (!reduce) loop(now); else draw(); });
  }

  strip.addEventListener("pointermove", function (e) {
    var r = strip.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  }, { passive: true });
  strip.addEventListener("pointerleave", function () {
    mouse.x = -9999;
    mouse.y = -9999;
  });
  strip.addEventListener("pointerdown", function (e) {
    if (e.target.closest && e.target.closest("a,button")) return;
    burst();
    say(POSES[poseIdx].line);
  });

  var rz = 0;
  window.addEventListener("resize", function () {
    clearTimeout(rz);
    rz = setTimeout(function () {
      fit();
      usePose(getFrame(POSES[poseIdx].file), POSES[poseIdx].name);
    }, 240);
  });

  if (window.MutationObserver) {
    new MutationObserver(function () {
      if (window.__themeRGB) accent = window.__themeRGB()[0].split(",").map(Number);
      buildGroups();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }
  if (window.__themeRGB) accent = window.__themeRGB()[0].split(",").map(Number);

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible) last = performance.now();
    }, { threshold: 0.01 }).observe(strip);
  }

  function boot() {
    fit();
    samplePose(getFrame(POSES[0].file), POSES[0].name, "", function (ok) {
      if (ok) start();
      else line.textContent = "分身素材没加载出来，刷新试试。";
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();