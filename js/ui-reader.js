/* 阅读器：正文排版渲染、翻页、菜单、目录、书签、进度 */
(function () {
  "use strict";
  var UI = window.UI;
  var W = 1024, H = 1400;
  var TEXT_TOP = 124;
  var HEAD_RULE = 92;
  var FOOT_RULE = 1310;

  function page() {
    if (!UI.layout) return null;
    return UI.layout.pages[UI.page] || null;
  }
  function chapterOf(p) {
    if (!p || !UI.layout) return null;
    return UI.layout.chapters[p.chap] || UI.layout.chapters[0];
  }
  function progress(p) {
    if (!p || !UI.layout) return 0;
    return Math.min(1, p.end / Math.max(1, UI.layout.textLength));
  }

  /* ------------------------------------------------------------ 阅读页 */

  UI.enterReader = function (book, layout) {
    UI.book = book;
    UI.layout = layout;
    UI.page = window.Engine.pageForOffset(layout, book.offset || 0);
    UI.view = "reader";
    UI.overlays.length = 0;
    UI.requestDraw();
  };

  UI.drawReader = function () {
    var t = UI.theme();
    if (!UI.layout || !UI.book) {
      text("正在载入…", W / 2, 700, { size: 24, color: t.faint, align: "center" });
      return;
    }
    var p = page();
    if (!p) return;
    var s = UI.settings;
    var stack = UI.readerFont();

    // 顶栏
    icon("back", 48, 50, 26, t.sub, 1.9);
    hit(16, 16, 64, 64, function () { UI.back(); });
    setFont(18, 400, UI.FONT_UI);
    ctx.fillStyle = t.faint;
    ctx.textAlign = "center";
    ctx.fillText(ellipsis(UI.book.title, 560), W / 2, 57);
    ctx.textAlign = "left";
    text("目录", 960, 58, { size: 19, color: t.sub, align: "right" });
    hit(872, 24, 100, 60, function () {
      openToc();
    });
    line(0, HEAD_RULE, W, HEAD_RULE, t.line2, 1);

    // 正文
    var margin = s.margin;
    var textW = W - margin * 2;
    var fs = s.fontSize;
    for (var i = 0; i < p.lines.length; i++) {
      var ln = p.lines[i];
      var top = TEXT_TOP + ln.top;
      if (ln.heading) {
        setFont(fs * 1.1, 500, stack);
        ctx.fillStyle = t.ink;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(ln.text, margin + textW / 2, top + ln.h / 2);
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
      } else {
        drawTextLine(ln, top, margin, textW, fs, stack, t);
      }
    }

    // 页脚
    if (s.showFooter) {
      var ch = chapterOf(p);
      setFont(17, 400, UI.FONT_UI);
      ctx.fillStyle = t.faint;
      ctx.fillText(ellipsis(ch ? ch.title : "", textW * 0.56), margin, 1342);
      var total = UI.layout.pages.length;
      text("第 " + (UI.page + 1) + " / " + total + " 页", 896, 1342, {
        size: 17, color: t.faint, align: "right"
      });
      text(Math.round(progress(p) * 100) + "%", 960, 1342, {
        size: 17, color: t.sub, align: "right", weight: "500"
      });
      var by = 1364;
      ctx.fillStyle = t.line2;
      ctx.fillRect(margin, by, textW, 2);
      ctx.fillStyle = t.ink;
      ctx.fillRect(margin, by, textW * progress(p), 2);
    }

    // 翻页热区
    var zy = HEAD_RULE, zh = FOOT_RULE - HEAD_RULE;
    hit(0, zy, W * 0.33, zh, function () { UI.turn(-1); });
    hit(W * 0.33, zy, W * 0.34, zh, function () { openMenu(); });
    hit(W * 0.67, zy, W * 0.33, zh, function () { UI.turn(1); });
  };

  function drawTextLine(ln, top, margin, textW, fs, stack, t) {
    var indent = ln.indent ? (isCJKChar(ln.text[0]) ? fs * 2 : fs * 1.55) : 0;
    var x = margin + indent;
    var avail = textW - indent;
    var y = top + ln.h / 2;
    var align = UI.settings.align;

    setFont(fs, 400, stack);
    ctx.fillStyle = t.ink;
    ctx.textBaseline = "middle";

    if (align !== "justify" || ln.last) {
      ctx.fillText(ln.text, x, y);
      ctx.textBaseline = "alphabetic";
      return;
    }

    var extra;
    var parts;
    var widths = [];
    var total = 0;
    if (ln.text.indexOf(" ") >= 0) {
      parts = ln.text.split(/ +/);
      for (var i = 0; i < parts.length; i++) {
        var w = ctx.measureText(parts[i]).width;
        widths.push(w);
        total += w;
      }
      var sp = ctx.measureText(" ").width;
      total += sp * (parts.length - 1);
      if (parts.length < 2) { ctx.fillText(ln.text, x, y); ctx.textBaseline = "alphabetic"; return; }
      extra = (avail - total) / (parts.length - 1);
      if (extra < 0 || extra > fs * 1.4) { ctx.fillText(ln.text, x, y); ctx.textBaseline = "alphabetic"; return; }
      var cx = x;
      for (var k = 0; k < parts.length; k++) {
        ctx.fillText(parts[k], cx, y);
        cx += widths[k] + sp + extra;
      }
    } else {
      var chars = Array.from(ln.text);
      if (chars.length < 2) { ctx.fillText(ln.text, x, y); ctx.textBaseline = "alphabetic"; return; }
      for (var m = 0; m < chars.length; m++) {
        var cw = ctx.measureText(chars[m]).width;
        widths.push(cw);
        total += cw;
      }
      extra = (avail - total) / (chars.length - 1);
      if (extra < 0 || extra > fs * 0.55) { ctx.fillText(ln.text, x, y); ctx.textBaseline = "alphabetic"; return; }
      var dx = x;
      for (var n = 0; n < chars.length; n++) {
        ctx.fillText(chars[n], dx, y);
        dx += widths[n] + extra;
      }
    }
    ctx.textBaseline = "alphabetic";
  }

  function isCJKChar(ch) {
    return !!ch && /[\u2e80-\u9fff\u3000-\u303f\uff00-\uffef]/.test(ch);
  }

  /* ------------------------------------------------------------ 翻页 */

  UI.turn = function (dir) {
    if (!UI.layout) return;
    var np = UI.page + dir;
    if (np < 0) { UI.toast("已经是第一页"); return; }
    if (np >= UI.layout.pages.length) { UI.toast("已经是最后一页"); return; }
    UI.page = np;
    savePosition();
    if (UI.settings.flash && window.Scene) window.Scene.flash();
    UI.requestDraw();
  };

  UI.jumpTo = function (offset, silent) {
    if (!UI.layout) return;
    UI.page = window.Engine.pageForOffset(UI.layout, offset);
    if (!silent) savePosition();
    if (!silent && UI.settings.flash && window.Scene) window.Scene.flash();
    UI.requestDraw();
  };

  function savePosition() {
    if (!UI.layout || !UI.book) return;
    var p = page();
    if (!p) return;
    UI.book.offset = p.start;
    UI.book.progress = Math.min(1, p.end / Math.max(1, UI.layout.textLength));
    UI.book.lastReadAt = Date.now();
    UI.book.finished = UI.page === UI.layout.pages.length - 1 && p.end >= UI.layout.textLength - 2;
    UI.hooks.saveLibrary && UI.hooks.saveLibrary();
    UI.hooks.progress && UI.hooks.progress(UI.book);
  }
  UI.savePosition = savePosition;

  /* ------------------------------------------------------------ 菜单 */

  function openMenu() {
    UI.open({ type: "readerMenu" });
  }

  function currentMark() {
    if (!UI.book || !UI.layout) return null;
    var p = page();
    var arr = UI.book.bookmarks || [];
    for (var i = 0; i < arr.length; i++) {
      if (Math.abs(arr[i].offset - p.start) < 2) return arr[i];
    }
    return null;
  }

  function toggleMark() {
    if (!UI.book || !UI.layout) return;
    var p = page();
    var existing = currentMark();
    UI.book.bookmarks = UI.book.bookmarks || [];
    if (existing) {
      UI.book.bookmarks = UI.book.bookmarks.filter(function (m) { return m !== existing; });
      UI.toast("已移除书签");
    } else {
      var snippet = UI.layout.text.slice(p.start, p.start + 70).replace(/\s+/g, " ").trim();
      UI.book.bookmarks.push({
        offset: p.start,
        page: UI.page,
        progress: Math.min(1, p.end / Math.max(1, UI.layout.textLength)),
        snippet: snippet || "第 " + (UI.page + 1) + " 页",
        at: Date.now()
      });
      UI.toast("已添加书签");
    }
    UI.book.bookmarks.sort(function (a, b) { return a.offset - b.offset; });
    UI.hooks.saveLibrary && UI.hooks.saveLibrary();
    UI.requestDraw();
  }

  function openToc() {
    var ch = chapterOf(page());
    var idx = ch ? UI.layout.chapters.indexOf(ch) : 0;
    UI.scroll.toc = Math.max(0, idx * 82 - 260);
    UI.open({ type: "toc" });
  }

  UI.drawReaderMenu = function (o) {
    var t = UI.theme();
    var panelH = 156;
    ctx.fillStyle = t.panel;
    ctx.fillRect(0, 0, W, panelH);
    line(0, panelH - 0.5, W, panelH - 0.5, t.line, 1);

    var marked = !!currentMark();
    var items = [
      { i: "back", label: "返回", fn: function () { UI.overlays.length = 0; UI.back(); } },
      { i: marked ? "bookmarkFill" : "bookmark", label: "书签", fn: function () {
        UI.overlays.length = 0;
        UI.open({ type: "marks" });
      } },
      { i: "toc", label: "目录", fn: openToc },
      { i: "aa", label: "Aa", fn: function () { UI.open({ type: "panel", tab: "font" }); } },
      { i: "slider", label: "进度", fn: function () { UI.open({ type: "progress" }); } }
    ];
    for (var i = 0; i < items.length; i++) {
      var cx = W * (i + 0.5) / items.length;
      if (items[i].i === "aa") {
        text("Aa", cx, 68, { size: 27, color: t.ink, align: "center", weight: "500", stack: UI.FONT_SERIF });
      } else {
        icon(items[i].i, cx, 58, 25, t.ink, 1.8);
      }
      text(items[i].label, cx, 118, { size: 16, color: t.sub, align: "center" });
      (function (fn) {
        hit(W * i / 5, 0, W / 5, panelH, fn);
      })(items[i].fn);
    }
  };

  /* ------------------------------------------------------------ 目录 */

  UI.drawToc = function (o) {
    var t = UI.theme();
    ctx.fillStyle = t.bg;
    ctx.fillRect(0, 0, W, H);

    text("目录", 64, 122, { size: 46, weight: "500", stack: UI.FONT_SERIF });
    setFont(18, 400, UI.FONT_UI);
    text(ellipsis(UI.book ? UI.book.title : "", 800), 66, 162, { size: 18, color: t.faint });
    icon("close", 950, 100, 22, t.sub, 1.7);
    hit(910, 62, 76, 76, function () { UI.overlays.pop(); UI.requestDraw(); });
    line(64, 196, 960, 196, t.line2, 1);

    var chapters = UI.layout.chapters;
    var rowH = 82;
    var cur = chapterOf(page());
    var contentH = chapters.length * rowH + 40;

    UI.scrollArea(64, 196, 896, 1336 - 196, "toc", contentH, function (off) {
      for (var i = 0; i < chapters.length; i++) {
        var y = 196 - off + i * rowH;
        if (y > 1370 || y + rowH < 180) continue;
        var c = chapters[i];
        var on = c === cur;
        if (on) {
          ctx.fillStyle = t.ink;
          ctx.fillRect(64, y + 18, 3, 44);
          ctx.fillStyle = "rgba(0,0,0,.035)";
          ctx.fillRect(64, y + 6, 896, rowH - 12);
        }
        setFont(15, 400, UI.FONT_UI);
        ctx.fillStyle = on ? t.sub : t.faint;
        ctx.fillText(String(i + 1).padStart(2, "0"), 86, y + 48);
        setFont(23, on ? 500 : 400, UI.FONT_UI);
        ctx.fillStyle = on ? t.ink : t.sub;
        ctx.fillText(ellipsis(c.title, 690), 132, y + 50);
        setFont(16, 400, UI.FONT_UI);
        ctx.fillStyle = t.faint;
        var pc = Math.round(((c.page + 1) / UI.layout.pages.length) * 100);
        ctx.fillText(pc + "%", 960, y + 48);
        if (i > 0) line(64, y, 960, y, t.line2, 1);
      }
    }, function (cx, cy) {
      var idx = Math.floor((cy - 196) / rowH);
      if (idx < 0 || idx >= chapters.length) return;
      UI.overlays.length = 0;
      UI.page = Math.min(UI.layout.pages.length - 1, chapters[idx].page);
      savePosition();
      if (UI.settings.flash && window.Scene) window.Scene.flash();
      UI.requestDraw();
    });
  };

  /* ------------------------------------------------------------ 书签面板 */

  UI.drawMarks = function (o) {
    var t = UI.theme();
    ctx.fillStyle = t.bg;
    ctx.fillRect(0, 0, W, H);
    text("书签", 64, 122, { size: 46, weight: "500", stack: UI.FONT_SERIF });
    text(UI.book ? UI.book.title : "", 66, 162, { size: 18, color: t.faint });
    icon("close", 950, 100, 22, t.sub, 1.7);
    hit(910, 62, 76, 76, function () { UI.overlays.pop(); UI.requestDraw(); });
    line(64, 196, 960, 196, t.line2, 1);

    var marks = (UI.book && UI.book.bookmarks) || [];
    if (!marks.length) {
      icon("bookmark", W / 2, 566, 44, t.line, 1.4);
      text("这一本还没有书签", W / 2, 638, { size: 24, color: t.sub, align: "center" });
      text("轻点「＋ 添加书签」标记当前页", W / 2, 676, { size: 17, color: t.faint, align: "center" });
    }

    var rowH = 124;
    var contentH = marks.length * rowH + 30;
    UI.scrollArea(64, 196, 896, 1336 - 196, "marks", contentH, function (off) {
      for (var i = 0; i < marks.length; i++) {
        var y = 196 - off + i * rowH;
        if (y > 1370 || y + rowH < 180) continue;
        if (i > 0) line(64, y, 960, y, t.line2, 1);
        icon("bookmarkFill", 82, y + 38, 18, t.ink, 1.4);
        setFont(21, 400, UI.FONT_UI);
        ctx.fillStyle = t.ink;
        var sn = wrapText(marks[i].snippet || "", 720, 2);
        for (var l = 0; l < sn.length; l++) ctx.fillText(sn[l], 108, y + 36 + l * 30);
        setFont(16, 400, UI.FONT_UI);
        ctx.fillStyle = t.faint;
        ctx.fillText(Math.round((marks[i].progress || 0) * 100) + "% · " + relTimeShort(marks[i].at), 108, y + 98);
        icon("close", 940, y + 40, 14, t.faint, 1.5);
      }
    }, function (cx, cy) {
      var idx = Math.floor((cy - 196) / rowH);
      if (idx < 0 || idx >= marks.length) return;
      var rowTop = 196 + idx * rowH;
      if (cx > 912 && cy - rowTop < 60) {
        UI.book.bookmarks = marks.filter(function (m, j) { return j !== idx; });
        UI.hooks.saveLibrary && UI.hooks.saveLibrary();
        UI.requestDraw();
        UI.toast("已删除书签");
        return;
      }
      UI.overlays.length = 0;
      UI.jumpTo(marks[idx].offset);
    });

    var has = !!currentMark();
    UI.button(has ? "移除本书签" : "＋ 添加书签", 694, 100, 196, 52, function () {
      toggleMark();
    }, { size: 19 });
  };

  function relTimeShort(ts) {
    if (!ts) return "";
    var d = Date.now() - ts;
    if (d < 60e3) return "刚刚";
    if (d < 3600e3) return Math.floor(d / 60e3) + " 分钟前";
    if (d < 86400e3) return Math.floor(d / 3600e3) + " 小时前";
    return Math.floor(d / 86400e3) + " 天前";
  }

  /* ------------------------------------------------------------ Aa 面板 */

  var TABS = [
    { key: "font", label: "字体" },
    { key: "layout", label: "版式" },
    { key: "light", label: "光线" }
  ];

  UI.drawPanel = function (o) {
    var t = UI.theme();
    var y0 = 848, ph = 552;
    ctx.fillStyle = t.panel;
    ctx.fillRect(0, y0, W, ph);
    line(0, y0, W, y0, t.line, 1);

    for (var i = 0; i < TABS.length; i++) {
      var tx = 64 + i * 132;
      var on = TABS[i].key === o.tab;
      text(TABS[i].label, tx, y0 + 52, {
        size: 21, color: on ? t.ink : t.faint, weight: on ? "500" : "400"
      });
      if (on) {
        ctx.fillStyle = t.ink;
        ctx.fillRect(tx, y0 + 66, 46, 2);
      }
      (function (key) {
        hit(tx - 12, y0 + 16, 100, 64, function () {
          o.tab = key;
          UI.requestDraw();
        });
      })(TABS[i].key);
    }
    icon("close", 940, y0 + 44, 18, t.faint, 1.6);
    hit(914, y0 + 18, 60, 60, function () { UI.overlays.pop(); UI.requestDraw(); });

    if (o.tab === "font") drawFontTab(y0);
    else if (o.tab === "layout") drawLayoutTab(y0);
    else drawLightTab(y0);

  };

  function labelValue(label, y, value) {
    var t = UI.theme();
    text(label, 64, y, { size: 21, color: t.ink });
    if (value != null) {
      text(value, 960, y, { size: 20, color: t.sub, align: "right" });
    }
  }

  function drawFontTab(y0) {
    var t = UI.theme();
    var s = UI.settings;
    var fam = ["serif", "sans", "kai"];
    labelValue("字体", y0 + 148, null);
    UI.segmented(520, y0 + 124, 440, 48, ["宋体", "黑体", "楷体"], fam.indexOf(s.fontFamily), function (i) {
      s.fontFamily = fam[i];
      UI.hooks.saveSettings && UI.hooks.saveSettings();
      UI.hooks.relayout && UI.hooks.relayout();
    }, 19);

    labelValue("字号", y0 + 224, s.fontSize);
    UI.slider(64, y0 + 250, 896, s.fontSize, 26, 48, 1, function (v) {
      s.fontSize = v;
      UI.requestDraw();
    }, function () {
      UI.hooks.saveSettings && UI.hooks.saveSettings();
      UI.hooks.relayout && UI.hooks.relayout();
    });

    labelValue("行距", y0 + 320, s.lineHeight.toFixed(2));
    UI.slider(64, y0 + 346, 896, s.lineHeight, 1.4, 2.2, 0.05, function (v) {
      s.lineHeight = v;
      UI.requestDraw();
    }, function () {
      UI.hooks.saveSettings && UI.hooks.saveSettings();
      UI.hooks.relayout && UI.hooks.relayout();
    });

    labelValue("页边距", y0 + 416, Math.round(s.margin));
    UI.slider(64, y0 + 442, 896, s.margin, 44, 120, 2, function (v) {
      s.margin = v;
      UI.requestDraw();
    }, function () {
      UI.hooks.saveSettings && UI.hooks.saveSettings();
      UI.hooks.relayout && UI.hooks.relayout();
    });
  }

  function drawLayoutTab(y0) {
    var t = UI.theme();
    var s = UI.settings;

    labelValue("对齐", y0 + 148, null);
    UI.segmented(520, y0 + 124, 440, 48, ["两端对齐", "左对齐"], s.align === "justify" ? 0 : 1, function (i) {
      s.align = i === 0 ? "justify" : "left";
      UI.hooks.saveSettings && UI.hooks.saveSettings();
      UI.hooks.relayout && UI.hooks.relayout();
    }, 19);

    labelValue("首行缩进", y0 + 224, null);
    UI.toggle(894, y0 + 206, s.indent, function (v) {
      s.indent = v;
      UI.hooks.saveSettings && UI.hooks.saveSettings();
      UI.hooks.relayout && UI.hooks.relayout();
    });

    labelValue("显示页脚", y0 + 300, null);
    UI.toggle(894, y0 + 282, s.showFooter, function (v) {
      s.showFooter = v;
      UI.hooks.saveSettings && UI.hooks.saveSettings();
      UI.hooks.relayout && UI.hooks.relayout();
    });

    labelValue("翻页刷新", y0 + 376, null);
    text("模拟墨水屏整屏反转的刷新感", 64, y0 + 402, { size: 16, color: t.faint });
    UI.toggle(894, y0 + 358, s.flash, function (v) {
      s.flash = v;
      UI.hooks.saveSettings && UI.hooks.saveSettings();
      if (v && window.Scene) window.Scene.flash();
      UI.requestDraw();
    });
  }

  function drawLightTab(y0) {
    var t = UI.theme();
    var s = UI.settings;
    var themes = ["paper", "sepia", "night"];
    labelValue("主题", y0 + 148, null);
    UI.segmented(520, y0 + 124, 440, 48, ["纸白", "米黄", "夜间"], themes.indexOf(s.theme), function (i) {
      s.theme = themes[i];
      UI.hooks.saveSettings && UI.hooks.saveSettings();
      UI.hooks.light && UI.hooks.light();
      UI.requestDraw();
      if (window.Scene) window.Scene.flash();
    }, 19);

    labelValue("亮度", y0 + 224, Math.round((s.brightness - 0.55) / 0.7 * 100) + "%");
    UI.slider(64, y0 + 250, 896, s.brightness, 0.55, 1.25, 0.01, function (v) {
      s.brightness = v;
      UI.hooks.light && UI.hooks.light();
      UI.requestDraw();
    }, function () {
      UI.hooks.saveSettings && UI.hooks.saveSettings();
    });

    labelValue("色温", y0 + 320, s.warmth > 0.66 ? "暖光" : (s.warmth > 0.33 ? "中性" : "冷白"));
    UI.slider(64, y0 + 346, 896, s.warmth, 0, 1, 0.01, function (v) {
      s.warmth = v;
      UI.hooks.light && UI.hooks.light();
      UI.requestDraw();
    }, function () {
      UI.hooks.saveSettings && UI.hooks.saveSettings();
    });

    text("亮度与色温会像真的前光灯一样作用在设备屏幕上。", 64, y0 + 424, {
      size: 16, color: t.faint
    });
  }

  /* ------------------------------------------------------------ 进度 */

  UI.drawProgress = function (o) {
    var t = UI.theme();
    var w = 760, h = 436, x = (W - w) / 2, y = 462;
    fillRR(x, y, w, h, 4, t.panel);
    strokeRR(x, y, w, h, 4, t.line, 1);

    text("阅读进度", x + 48, y + 62, { size: 19, color: t.faint });
    icon("close", x + w - 44, y + 50, 16, t.faint, 1.6);
    hit(x + w - 72, y + 22, 56, 56, function () { UI.overlays.pop(); UI.requestDraw(); });

    var p = page();
    var pg = progress(p);
    setFont(76, 500, UI.FONT_SERIF);
    ctx.fillStyle = t.ink;
    ctx.fillText(Math.round(pg * 100) + "%", x + 48, y + 158);
    setFont(18, 400, UI.FONT_UI);
    ctx.fillStyle = t.faint;
    var left = Math.max(0, Math.round((UI.layout.textLength - (p ? p.end : 0)) / 380));
    ctx.fillText("第 " + (UI.page + 1) + " / " + UI.layout.pages.length + " 页", x + 52, y + 208);
    ctx.fillText("剩余约 " + left + " 分钟", x + w - 48 - ctx.measureText("剩余约 " + left + " 分钟").width, y + 208);

    // 极简刻度
    var sx = x + 52, sw = w - 104, sy = y + 268;
    for (var i = 0; i <= 10; i++) {
      ctx.fillStyle = i / 10 <= pg ? t.ink : t.line;
      ctx.fillRect(sx + sw * i / 10, sy + (i % 5 === 0 ? 0 : 6), 1, i % 5 === 0 ? 18 : 12);
    }
    ctx.fillStyle = t.ink;
    ctx.fillRect(sx + sw * pg - 1, sy - 12, 2, 28);

    // 拖动条
    (function () {
      function apply(px) {
        var r = Math.max(0, Math.min(1, (px - sx) / sw));
        var off = Math.floor(r * (UI.layout.textLength - 1));
        UI.jumpTo(off, true);
      }
      hit(sx - 20, sy - 30, sw + 40, 60, apply, {
        onDrag: function (px) { apply(px); },
        onDragEnd: function () { savePosition(); }
      });
    })();

    var ch = chapterOf(p);
    setFont(17, 400, UI.FONT_UI);
    ctx.fillStyle = t.sub;
    ctx.fillText(ellipsis(ch ? ch.title : "", w - 120), x + 52, y + 340);

  };
})();
