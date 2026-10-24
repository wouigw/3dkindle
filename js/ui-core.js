/* 墨水屏 UI 核心：画布、主题、命中区域、拖拽滚动、通用控件 */
(function () {
  "use strict";

  var W = 1024, H = 1400;
  var CW = 1200, CH = 1640;
  var S = CW / W;

  var FONT_UI = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC",-apple-system,"Segoe UI",sans-serif';
  var FONT_SERIF = '"Songti SC","Noto Serif SC","Source Han Serif SC","SimSun","STSong",Georgia,serif';
  var FONT_SANS = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC",sans-serif';
  var FONT_KAI = '"Kaiti SC","STKaiti","KaiTi","KaiTi_GB2312",serif';
  var FONT_READ_SERIF = 'Georgia,"Times New Roman","Songti SC","Noto Serif SC","SimSun",serif';
  var FONT_READ_SANS = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC",sans-serif';

  var THEMES = {
    paper: {
      bg: "#F3F2EC", panel: "#E9E7DE", panel2: "#DFDCD1",
      ink: "#15171A", sub: "#5C5F63", faint: "#8D8F8A",
      line: "#D3D0C4", line2: "#E2DFD5", reverse: "#F7F6F1", scrim: "rgba(18,18,16,.30)"
    },
    sepia: {
      bg: "#F2E6CE", panel: "#E9DBBE", panel2: "#DCCCA9",
      ink: "#2A2117", sub: "#6B5A41", faint: "#947F5F",
      line: "#D9C6A2", line2: "#E7D9BF", reverse: "#FBF3E2", scrim: "rgba(40,28,12,.30)"
    },
    night: {
      bg: "#15171A", panel: "#1E2126", panel2: "#272B31",
      ink: "#D7D4CB", sub: "#94918A", faint: "#67665F",
      line: "#33373D", line2: "#262A2F", reverse: "#15171A", scrim: "rgba(0,0,0,.45)"
    }
  };

  var UI = {
    W: W, H: H, CW: CW, CH: CH, S: S,
    canvas: null, ctx: null,
    books: [], settings: null,
    view: "boot",
    book: null, layout: null, page: 0,
    overlays: [],
    scroll: { library: 0, toc: 0, marks: 0, allmarks: 0 },
    regions: [],
    dirty: true,
    hooks: {},
    FONT_UI: FONT_UI, FONT_SERIF: FONT_SERIF, FONT_KAI: FONT_KAI,
    bootP: 0,
    _toast: null,
    _scrollInfo: null,
    _battery: null
  };
  window.UI = UI;

  /* ------------------------------------------------------------ 基础绘制 */

  var ctx;
  function th() { return THEMES[(UI.settings && UI.settings.theme) || "paper"] || THEMES.paper; }
  UI.theme = th;

  function setFont(size, weight, stack) {
    ctx.font = (weight || "400") + " " + size + "px " + (stack || FONT_UI);
  }
  function mw(s) { return ctx.measureText(s).width; }

  function fill(col) { ctx.fillStyle = col; }
  function rr(x, y, w, h, r) {
    var rad = Math.min(r || 0, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.lineTo(x + w - rad, y);
    ctx.arcTo(x + w, y, x + w, y + rad, rad);
    ctx.lineTo(x + w, y + h - rad);
    ctx.arcTo(x + w, y + h, x + w - rad, y + h, rad);
    ctx.lineTo(x + rad, y + h);
    ctx.arcTo(x, y + h, x, y + h - rad, rad);
    ctx.lineTo(x, y + rad);
    ctx.arcTo(x, y, x + rad, y, rad);
    ctx.closePath();
  }
  function fillRR(x, y, w, h, r, col) { fill(col); rr(x, y, w, h, r); ctx.fill(); }
  function strokeRR(x, y, w, h, r, col, lw) {
    ctx.strokeStyle = col; ctx.lineWidth = lw || 1;
    rr(x + 0.5, y + 0.5, w - 1, h - 1, r); ctx.stroke();
  }
  function line(x1, y1, x2, y2, col, lw) {
    ctx.strokeStyle = col; ctx.lineWidth = lw || 1;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  function text(str, x, y, o) {
    o = o || {};
    setFont(o.size || 22, o.weight, o.stack);
    ctx.fillStyle = o.color || th().ink;
    ctx.textAlign = o.align || "left";
    ctx.textBaseline = o.baseline || "alphabetic";
    if (o.max) ctx.fillText(str, x, y, o.max);
    else ctx.fillText(str, x, y);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }
  function trackText(str, x, y, tracking, o) {
    o = o || {};
    setFont(o.size || 18, o.weight, o.stack);
    ctx.fillStyle = o.color || th().faint;
    var chars = Array.from(str);
    var total = 0;
    for (var i = 0; i < chars.length; i++) total += mw(chars[i]);
    total += tracking * Math.max(0, chars.length - 1);
    var cx = (o.align === "center") ? x - total / 2 : (o.align === "right" ? x - total : x);
    for (var j = 0; j < chars.length; j++) {
      ctx.fillText(chars[j], cx, y);
      cx += mw(chars[j]) + tracking;
    }
  }
  function ellipsis(str, maxW) {
    if (mw(str) <= maxW) return str;
    var chars = Array.from(str);
    var out = "";
    for (var i = 0; i < chars.length; i++) {
      if (mw(out + chars[i] + "…") > maxW) break;
      out += chars[i];
    }
    return out + "…";
  }
  function wrapText(str, maxW, maxLines) {
    var chars = Array.from(str);
    var lines = [];
    var cur = "";
    for (var i = 0; i < chars.length; i++) {
      if (mw(cur + chars[i]) > maxW && cur) {
        lines.push(cur);
        cur = chars[i];
        if (lines.length === maxLines) return lines;
      } else {
        cur += chars[i];
      }
    }
    if (cur && lines.length < maxLines) lines.push(cur);
    return lines;
  }

  /* ------------------------------------------------------------ 图标 */

  function icon(name, cx, cy, size, color, lw) {
    var h = size / 2;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lw || 1.9;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    switch (name) {
      case "back":
        ctx.moveTo(cx + h * 0.42, cy - h * 0.62);
        ctx.lineTo(cx - h * 0.36, cy);
        ctx.lineTo(cx + h * 0.42, cy + h * 0.62);
        ctx.stroke(); break;
      case "chev":
        ctx.moveTo(cx - h * 0.25, cy - h * 0.42);
        ctx.lineTo(cx + h * 0.25, cy);
        ctx.lineTo(cx - h * 0.25, cy + h * 0.42);
        ctx.stroke(); break;
      case "plus":
        ctx.moveTo(cx - h * 0.62, cy); ctx.lineTo(cx + h * 0.62, cy);
        ctx.moveTo(cx, cy - h * 0.62); ctx.lineTo(cx, cy + h * 0.62);
        ctx.stroke(); break;
      case "close":
        ctx.moveTo(cx - h * 0.5, cy - h * 0.5); ctx.lineTo(cx + h * 0.5, cy + h * 0.5);
        ctx.moveTo(cx + h * 0.5, cy - h * 0.5); ctx.lineTo(cx - h * 0.5, cy + h * 0.5);
        ctx.stroke(); break;
      case "grid":
        var g = h * 0.9;
        ctx.strokeRect(cx - g, cy - g, g * 0.82, g * 0.82);
        ctx.strokeRect(cx + g * 0.16, cy - g, g * 0.82, g * 0.82);
        ctx.strokeRect(cx - g, cy + g * 0.16, g * 0.82, g * 0.82);
        ctx.strokeRect(cx + g * 0.16, cy + g * 0.16, g * 0.82, g * 0.82);
        break;
      case "list":
        [-0.55, 0, 0.55].forEach(function (o) {
          ctx.moveTo(cx - h * 0.62, cy + h * o);
          ctx.lineTo(cx + h * 0.62, cy + h * o);
        });
        ctx.stroke(); break;
      case "bookmark":
        ctx.moveTo(cx - h * 0.42, cy - h * 0.62);
        ctx.lineTo(cx + h * 0.42, cy - h * 0.62);
        ctx.lineTo(cx + h * 0.42, cy + h * 0.64);
        ctx.lineTo(cx, cy + h * 0.26);
        ctx.lineTo(cx - h * 0.42, cy + h * 0.64);
        ctx.closePath();
        ctx.stroke(); break;
      case "bookmarkFill":
        ctx.moveTo(cx - h * 0.42, cy - h * 0.62);
        ctx.lineTo(cx + h * 0.42, cy - h * 0.62);
        ctx.lineTo(cx + h * 0.42, cy + h * 0.64);
        ctx.lineTo(cx, cy + h * 0.26);
        ctx.lineTo(cx - h * 0.42, cy + h * 0.64);
        ctx.closePath();
        ctx.fill(); break;
      case "toc":
        ctx.moveTo(cx - h * 0.72, cy - h * 0.52); ctx.lineTo(cx + h * 0.72, cy - h * 0.52);
        ctx.moveTo(cx - h * 0.72, cy); ctx.lineTo(cx + h * 0.42, cy);
        ctx.moveTo(cx - h * 0.72, cy + h * 0.52); ctx.lineTo(cx + h * 0.2, cy + h * 0.52);
        ctx.stroke(); break;
      case "gear":
        ctx.arc(cx, cy, h * 0.28, 0, Math.PI * 2);
        for (var i = 0; i < 8; i++) {
          var a = (i / 8) * Math.PI * 2;
          ctx.moveTo(cx + Math.cos(a) * h * 0.44, cy + Math.sin(a) * h * 0.44);
          ctx.lineTo(cx + Math.cos(a) * h * 0.72, cy + Math.sin(a) * h * 0.72);
        }
        ctx.stroke(); break;
      case "trash":
        ctx.moveTo(cx - h * 0.62, cy - h * 0.46); ctx.lineTo(cx + h * 0.62, cy - h * 0.46);
        ctx.moveTo(cx - h * 0.24, cy - h * 0.72); ctx.lineTo(cx + h * 0.24, cy - h * 0.72);
        ctx.moveTo(cx - h * 0.46, cy - h * 0.46); ctx.lineTo(cx - h * 0.36, cy + h * 0.66);
        ctx.lineTo(cx + h * 0.36, cy + h * 0.66); ctx.lineTo(cx + h * 0.46, cy - h * 0.46);
        ctx.stroke(); break;
      case "sort":
        ctx.moveTo(cx - h * 0.66, cy - h * 0.42); ctx.lineTo(cx + h * 0.06, cy - h * 0.42);
        ctx.moveTo(cx - h * 0.66, cy); ctx.lineTo(cx - h * 0.12, cy);
        ctx.moveTo(cx - h * 0.66, cy + h * 0.42); ctx.lineTo(cx - h * 0.3, cy + h * 0.42);
        ctx.moveTo(cx + h * 0.42, cy - h * 0.5); ctx.lineTo(cx + h * 0.42, cy + h * 0.46);
        ctx.moveTo(cx + h * 0.18, cy + h * 0.2); ctx.lineTo(cx + h * 0.42, cy + h * 0.48);
        ctx.lineTo(cx + h * 0.66, cy + h * 0.2);
        ctx.stroke(); break;
      case "check":
        ctx.moveTo(cx - h * 0.5, cy); ctx.lineTo(cx - h * 0.08, cy + h * 0.4);
        ctx.lineTo(cx + h * 0.55, cy - h * 0.42);
        ctx.stroke(); break;
      case "book":
        ctx.moveTo(cx, cy - h * 0.5);
        ctx.bezierCurveTo(cx - h * 0.2, cy - h * 0.68, cx - h * 0.5, cy - h * 0.66, cx - h * 0.66, cy - h * 0.58);
        ctx.lineTo(cx - h * 0.66, cy + h * 0.52);
        ctx.bezierCurveTo(cx - h * 0.4, cy + h * 0.44, cx - h * 0.2, cy + h * 0.5, cx, cy + h * 0.66);
        ctx.bezierCurveTo(cx + h * 0.2, cy + h * 0.5, cx + h * 0.4, cy + h * 0.44, cx + h * 0.66, cy + h * 0.52);
        ctx.lineTo(cx + h * 0.66, cy - h * 0.58);
        ctx.bezierCurveTo(cx + h * 0.4, cy - h * 0.66, cx + h * 0.2, cy - h * 0.68, cx, cy - h * 0.5);
        ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy - h * 0.5); ctx.lineTo(cx, cy + h * 0.66); ctx.stroke();
        break;
      case "wifi":
        ctx.arc(cx, cy + h * 0.42, h * 0.72, Math.PI * 1.22, Math.PI * 1.78);
        ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy + h * 0.42, h * 0.42, Math.PI * 1.22, Math.PI * 1.78); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy + h * 0.4, 1.6, 0, Math.PI * 2); ctx.fill();
        break;
      case "sun":
        ctx.arc(cx, cy, h * 0.3, 0, Math.PI * 2); ctx.stroke();
        for (var k = 0; k < 8; k++) {
          var an = (k / 8) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(an) * h * 0.5, cy + Math.sin(an) * h * 0.5);
          ctx.lineTo(cx + Math.cos(an) * h * 0.72, cy + Math.sin(an) * h * 0.72);
          ctx.stroke();
        }
        break;
      case "moon":
        ctx.arc(cx, cy, h * 0.55, 0.5, Math.PI * 1.9);
        ctx.stroke(); break;
      case "slider":
        ctx.moveTo(cx - h * 0.72, cy); ctx.lineTo(cx + h * 0.72, cy);
        ctx.stroke();
        ctx.beginPath(); ctx.arc(cx + h * 0.1, cy, h * 0.22, 0, Math.PI * 2); ctx.stroke();
        break;
      case "arrowUp":
        ctx.moveTo(cx, cy + h * 0.3); ctx.lineTo(cx, cy - h * 0.5);
        ctx.moveTo(cx - h * 0.4, cy - h * 0.1); ctx.lineTo(cx, cy - h * 0.52);
        ctx.lineTo(cx + h * 0.4, cy - h * 0.1);
        ctx.stroke(); break;
    }
    ctx.restore();
  }

  /* ------------------------------------------------------------ 命中 */

  UI.regions = [];
  function hit(x, y, w, h, fn, opt) {
    UI.regions.push({ x: x, y: y, w: w, h: h, fn: fn, opt: opt || {} });
  }
  function findRegion(x, y) {
    for (var i = UI.regions.length - 1; i >= 0; i--) {
      var r = UI.regions[i];
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return r;
    }
    return null;
  }
  UI.findRegion = findRegion;

  UI.pointerDown = function (x, y) {
    UI._down = { x: x, y: y, t: performance.now() };
    UI._moved = false;
    var r = findRegion(x, y);
    UI._region = r;
    UI._last = { x: x, y: y };
    UI._dragging = false;
    if (r && r.opt.onDrag) {
      UI._dragging = true;
      if (r.opt.onDragStart) r.opt.onDragStart(x, y);
      return true;
    }
    return false;
  };
  UI.pointerMove = function (x, y) {
    if (!UI._down) return;
    var dx = x - UI._last.x, dy = y - UI._last.y;
    UI._last = { x: x, y: y };
    if (UI._dragging && UI._region && UI._region.opt.onDrag) {
      UI._region.opt.onDrag(x, y, dx, dy);
      UI._moved = true;
    } else if (Math.abs(x - UI._down.x) > 9 || Math.abs(y - UI._down.y) > 9) {
      UI._moved = true;
    }
  };
  UI.pointerUp = function (x, y) {
    var r = UI._region;
    if (r && !UI._moved && performance.now() - UI._down.t < 800) {
      if (r.fn) r.fn(x, y);
    }
    if (UI._dragging && r && r.opt.onDragEnd) r.opt.onDragEnd(x, y);
    UI._down = null; UI._region = null; UI._dragging = false; UI._moved = false;
  };
  UI.pointerLongPress = function (x, y) {
    var r = findRegion(x, y);
    if (r && r.opt.onLongPress) {
      UI._moved = true;
      r.opt.onLongPress(x, y);
    }
  };
  UI.hasDragAt = function (x, y) {
    var r = findRegion(x, y);
    return !!(r && r.opt.onDrag);
  };

  UI.requestDraw = function () { UI.dirty = true; };
  UI.cancelPress = function () {
    UI._down = null; UI._region = null; UI._dragging = false; UI._moved = false;
  };

  /* ------------------------------------------------------------ 滚动区域 */

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  UI.clamp = clamp;

  /**
   * 列表滚动区。onTapContent/onLongContent 收到的是"内容坐标系"的 y。
   */
  function scrollArea(x, y, w, h, key, contentH, drawContent, onTapContent, onLongContent) {
    var max = Math.max(0, contentH - h);
    UI.scroll[key] = clamp(UI.scroll[key] || 0, 0, max);
    var off = UI.scroll[key];

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    drawContent(off, x, y, w, h);
    ctx.restore();

    if (contentH > h + 2) {
      var trackY = y + 8, trackH = h - 16;
      var ratio = h / contentH;
      var barH = Math.max(48, trackH * ratio);
      var barY = trackY + (trackH - barH) * (off / max);
      fillRR(x + w + 6, barY, 2.5, barH, 2, th().line);
    }

    UI._scrollInfo = { key: key, x: x, y: y, w: w, h: h, max: max };
    hit(x, y, w, h, function (px, py) {
      if (onTapContent) onTapContent(px, py + UI.scroll[key]);
    }, {
      onDrag: function (px, py, dx, dy) {
        UI.scroll[key] = clamp(UI.scroll[key] - dy, 0, max);
        UI.requestDraw();
      },
      onLongPress: function (px, py) {
        if (onLongContent) onLongContent(px, py + UI.scroll[key]);
      }
    });
  }
  UI.scrollArea = scrollArea;

  UI.wheel = function (x, y, dy) {
    var top = UI.overlays.length ? UI.overlays[UI.overlays.length - 1] : null;
    if (top && top.type !== "toc" && top.type !== "marks") return false;
    var s = UI._scrollInfo;
    if (!s) return false;
    if (x < s.x || x > s.x + s.w || y < s.y || y > s.y + s.h) return false;
    UI.scroll[s.key] = clamp((UI.scroll[s.key] || 0) + dy, 0, s.max);
    UI.requestDraw();
    return true;
  };

  /* ------------------------------------------------------------ 通用控件 */

  UI.button = function (label, x, y, w, h, fn, opts) {
    opts = opts || {};
    var t = th();
    if (opts.primary) {
      fillRR(x, y, w, h, 3, t.ink);
      text(label, x + w / 2, y + h / 2 + 1, {
        size: opts.size || 22, color: t.reverse, align: "center", baseline: "middle",
        weight: opts.weight || "500", stack: opts.stack
      });
    } else {
      fillRR(x, y, w, h, 3, "transparent");
      strokeRR(x, y, w, h, 3, opts.color || t.faint, 1);
      text(label, x + w / 2, y + h / 2 + 1, {
        size: opts.size || 22, color: opts.color || t.ink, align: "center", baseline: "middle",
        weight: opts.weight || "400", stack: opts.stack
      });
    }
    hit(x, y, w, h, fn);
  };

  UI.iconButton = function (name, cx, cy, size, fn, opts) {
    opts = opts || {};
    var pad = opts.pad || 34;
    icon(name, cx, cy, size, opts.color || th().ink, opts.lw || 1.9);
    hit(cx - pad / 2, cy - pad / 2, pad, pad, fn, { id: opts.id });
  };

  UI.segmented = function (x, y, w, h, items, active, onPick, size) {
    var t = th();
    var cell = w / items.length;
    strokeRR(x, y, w, h, 2, t.line, 1);
    for (var i = 0; i < items.length; i++) {
      if (i > 0) line(x + cell * i, y, x + cell * i, y + h, t.line, 1);
      if (i === active) {
        ctx.fillStyle = t.ink;
        ctx.fillRect(x + cell * i + 1, y + 1, cell - 2, h - 2);
      }
      text(items[i], x + cell * i + cell / 2, y + h / 2 + 1, {
        size: size || 20, color: i === active ? t.reverse : t.ink,
        align: "center", baseline: "middle", weight: i === active ? "500" : "400"
      });
      (function (idx) {
        hit(x + cell * idx, y, cell, h, function () {
          onPick(idx);
          UI.requestDraw();
        });
      })(i);
    }
  };

  UI.toggle = function (x, y, on, fn) {
    var t = th();
    var w = 66, h = 34;
    if (on) {
      fillRR(x, y, w, h, 17, t.ink);
      fillRR(x + w - 28, y + 4, 26, 26, 13, t.reverse);
    } else {
      fillRR(x, y, w, h, 17, "transparent");
      strokeRR(x, y, w, h, 17, t.faint, 1);
      fillRR(x + 4, y + 4, 26, 26, 13, t.faint);
    }
    hit(x - 8, y - 12, w + 16, h + 24, function () { fn(!on); UI.requestDraw(); });
  };

  UI.slider = function (x, y, w, val, min, max, step, onInput, onCommit) {
    var t = th();
    var ratio = (val - min) / (max - min);
    fillRR(x, y - 1, w, 3, 1.5, t.line);
    fillRR(x, y - 1, Math.max(0, w * ratio), 3, 1.5, t.ink);
    var kx = x + w * ratio;
    fillRR(kx - 7, y - 12, 14, 24, 2, t.bg);
    strokeRR(kx - 7, y - 12, 14, 24, 2, t.ink, 1.4);

    function apply(px) {
      var r = clamp((px - x) / w, 0, 1);
      var v = min + r * (max - min);
      if (step) v = Math.round(v / step) * step;
      v = clamp(v, min, max);
      if (v !== val) { val = v; onInput(v); UI.requestDraw(); }
    }
    hit(x - 20, y - 26, w + 40, 60, function (px) { apply(px); }, {
      onDrag: function (px) { apply(px); },
      onDragEnd: function () { if (onCommit) onCommit(val); }
    });
  };

  UI.statusBar = function () {
    var t = th();
    trackText("kindle", 64, 48, 2.6, { size: 17, color: t.faint, weight: "500" });
    // battery
    var bx = 896, by = 38, bw = 32, bh = 15;
    strokeRR(bx, by, bw, bh, 2, t.sub, 1.2);
    fillRR(bx + bw + 2, by + 4.5, 2.6, 6, 1, t.sub);
    var lvl = UI._battery != null ? UI._battery : 0.82;
    fillRR(bx + 2.5, by + 2.5, (bw - 5) * lvl, bh - 5, 1, t.sub);
    // wifi
    icon("wifi", 862, 44, 22, t.sub, 1.5);
    // time
    var d = new Date();
    var hh = d.getHours(), mm = d.getMinutes();
    var tt = (hh < 10 ? "0" : "") + hh + ":" + (mm < 10 ? "0" : "") + mm;
    text(tt, 964, 49, { size: 19, color: t.sub, align: "right" });
  };

  UI.sectionLabel = function (title, y) {
    var t = th();
    trackText(title, 64, y, 1.6, { size: 16, color: t.faint, weight: "500" });
    line(64, y + 16, 960, y + 16, t.line2, 1);
  };

  UI.toast = function (msg, ms) {
    UI._toast = { msg: msg, until: performance.now() + (ms || 1900) };
    UI.requestDraw();
    setTimeout(function () { UI.requestDraw(); }, (ms || 1900) + 30);
  };

  /* ------------------------------------------------------------ 覆盖层 */

  UI.open = function (o) { UI.overlays.push(o); UI.requestDraw(); };
  UI.close = function () { UI.overlays.pop(); UI.requestDraw(); };
  UI.closeAll = function () { UI.overlays.length = 0; UI.requestDraw(); };
  UI.topOverlay = function () { return UI.overlays.length ? UI.overlays[UI.overlays.length - 1] : null; };

  function scrim(alpha) {
    ctx.fillStyle = "rgba(12,12,10," + (alpha == null ? 0.3 : alpha) + ")";
    ctx.fillRect(0, 0, W, H);
    hit(0, 0, W, H, function () {
      if (UI.overlays.length) { UI.overlays.pop(); UI.requestDraw(); }
    }, {});
  }
  UI.scrim = scrim;

  UI.overlayAbsorb = function (fn) {
    hit(0, 0, W, H, fn || function () {}, {});
  };

  /* ------------------------------------------------------------ 视图切换 */

  UI.go = function (v) {
    UI.view = v;
    UI.overlays.length = 0;
    UI.requestDraw();
  };

  UI.back = function () {
    if (UI.overlays.length) { UI.overlays.pop(); UI.requestDraw(); return; }
    if (UI.view === "reader") {
      if (UI.hooks.leaveReader) UI.hooks.leaveReader();
      UI.view = "library";
      UI.book = null; UI.layout = null;
      UI.requestDraw();
      return;
    }
    if (UI.view !== "library") { UI.view = "library"; UI.requestDraw(); }
  };

  /* ------------------------------------------------------------ 主绘制 */

  UI.draw = function () {
    if (!ctx) return;
    var t = th();
    ctx.setTransform(S, 0, 0, S, 0, 0);
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    UI.regions = [];
    UI._scrollInfo = null;

    ctx.fillStyle = t.bg;
    ctx.fillRect(0, 0, W, H);

    if (UI.view === "boot") drawBoot();
    else if (UI.view === "reader") UI.drawReader();
    else if (UI.view === "bookmarks") UI.drawAllBookmarks();
    else if (UI.view === "settings") UI.drawSettings();
    else UI.drawLibrary();

    for (var i = 0; i < UI.overlays.length; i++) {
      var o = UI.overlays[i];
      scrim(o.alpha == null ? 0.28 : o.alpha);
      if (o.type === "readerMenu") UI.drawReaderMenu(o);
      else if (o.type === "panel") UI.drawPanel(o);
      else if (o.type === "toc") UI.drawToc(o);
      else if (o.type === "marks") UI.drawMarks(o);
      else if (o.type === "progress") UI.drawProgress(o);
      else if (o.type === "bookActions") UI.drawBookActions(o);
      else if (o.type === "confirm") UI.drawConfirm(o);
      else if (o.type === "sortMenu") UI.drawSortMenu(o);
      else if (o.type === "importing") UI.drawImporting(o);
    }

    if (UI._toast) {
      if (performance.now() > UI._toast.until) UI._toast = null;
      else drawToast(UI._toast.msg);
    }

    UI.dirty = false;
  };

  function drawToast(msg) {
    var t = th();
    setFont(19, 400, FONT_UI);
    if (mw(msg) > 690) msg = ellipsis(msg, 690);
    var w = Math.min(760, mw(msg) + 56);
    var x = (W - w) / 2, y = 1256;
    fillRR(x, y, w, 50, 3, "rgba(20,21,22,.92)");
    text(msg, W / 2, y + 26, { size: 19, color: "#EFEEE8", align: "center", baseline: "middle" });
  }

  function drawBoot() {
    var t = th();
    var cy = 610;
    setFont(64, 400, 'Georgia,"Times New Roman",serif');
    ctx.fillStyle = t.ink;
    ctx.textAlign = "center";
    ctx.fillText("kindle", W / 2, cy);
    ctx.textAlign = "left";

    ctx.fillStyle = t.faint;
    ctx.fillRect(W / 2 - 82, cy + 44, 164, 1);
    var p = UI.bootP;
    ctx.fillStyle = t.ink;
    ctx.fillRect(W / 2 - 82, cy + 44, 164 * p, 1);

    trackText("墨水屏 · 模拟器", W / 2, cy + 92, 4, { size: 15, color: t.faint, align: "center" });
    trackText("THREE.JS  /  E-INK", W / 2, 1284, 3.4, { size: 12, color: t.faint, align: "center" });

    // 装饰：三条渐短的横线
    [[0, 64], [1, 46], [2, 28]].forEach(function (d) {
      ctx.fillStyle = t.line;
      ctx.fillRect(W / 2 - d[1] / 2, cy + 140 + d[0] * 12, d[1], 1);
    });
    UI.dirty = true; // 启动动画持续重绘
  }

  /* ------------------------------------------------------------ 初始化 */

  UI.init = function (canvas, opts) {
    UI.canvas = canvas;
    UI.ctx = canvas.getContext("2d");
    ctx = UI.ctx;
    window.ctx = ctx;
    canvas.width = CW;
    canvas.height = CH;
    UI.books = opts.books || [];
    UI.settings = opts.settings;
    UI.hooks = opts.hooks || {};
    UI.view = "boot";
    UI.bootP = 0;
    UI.requestDraw();
    return UI;
  };

  UI.readerFont = function () {
    var f = UI.settings.fontFamily;
    if (f === "sans") return FONT_SANS;
    if (f === "kai") return FONT_KAI;
    return FONT_READ_SERIF;
  };
  UI.readerCfg = function () {
    var fs = UI.settings.fontSize;
    return {
      width: W - UI.settings.margin * 2,
      height: UI.settings.showFooter ? 1166 : 1212,
      fontSize: fs,
      lineHeight: UI.settings.lineHeight,
      fontStack: UI.readerFont(),
      weight: "400",
      indent: UI.settings.indent,
      align: UI.settings.align,
      ctx: UI.ctx
    };
  };
  UI.layoutSig = function () {
    var s = UI.settings;
    return [s.fontSize, s.lineHeight, s.margin, s.fontFamily, s.align, s.indent, s.showFooter].join("|");
  };

  UI.progressOf = function (book) {
    return Math.max(0, Math.min(1, book.progress || 0));
  };

  /* 暴露绘图原语给其他 UI 文件（它们运行在同一画布上） */
  window.hit = hit;
  window.setFont = setFont;
  window.mw = mw;
  window.fillRR = fillRR;
  window.strokeRR = strokeRR;
  window.line = line;
  window.text = text;
  window.trackText = trackText;
  window.ellipsis = ellipsis;
  window.wrapText = wrapText;
  window.icon = icon;
  window.rr = rr;
})();
