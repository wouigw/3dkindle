/* 书架、书签汇总、书籍操作 */
(function () {
  "use strict";
  var UI = window.UI;
  var W = 1024, H = 1400;

  var GX = 64, GY = 252, GW = 896, GAP = 40, COLS = 3;
  var COLW = (GW - GAP * (COLS - 1)) / COLS;
  var COVERH = Math.round(COLW * 1.46);
  var ROWH = 512;
  var NAVY = 1306;

  var SORTS = [
    { key: "recent", label: "最近阅读" },
    { key: "title", label: "书名" },
    { key: "added", label: "导入时间" }
  ];

  function sortedBooks() {
    var arr = UI.books.slice();
    var s = UI.settings.sort || "recent";
    if (s === "title") {
      arr.sort(function (a, b) { return a.title.localeCompare(b.title, "zh-Hans-CN"); });
    } else if (s === "added") {
      arr.sort(function (a, b) { return (b.addedAt || 0) - (a.addedAt || 0); });
    } else {
      arr.sort(function (a, b) {
        return (b.lastReadAt || 0) - (a.lastReadAt || 0) || (b.addedAt || 0) - (a.addedAt || 0);
      });
    }
    return arr;
  }

  /* --------------------------------------------------------------- 封面 */

  function coverPalette(seed) {
    var bgs = ["#E8E3D5", "#DFDACC", "#EDE9DC", "#E2DED2", "#D8D4C7"];
    return { bg: bgs[seed % bgs.length], ink: "#1A1B1D", soft: "#6C6A62" };
  }

  function drawCover(book, x, y, w, h) {
    var c = coverPalette(book.seed || 0);
    var seed = (book.seed || 0) % 5;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();

    ctx.fillStyle = c.bg;
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = c.ink;
    var art = h * 0.56;

    if (seed === 0) {
      // 落日
      ctx.strokeStyle = c.ink;
      ctx.lineWidth = Math.max(1, w * 0.008);
      ctx.beginPath();
      ctx.arc(x + w * 0.66, y + h * 0.27, w * 0.17, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = c.ink;
      ctx.fillRect(x + w * 0.22, y + art * 0.78, w * 0.56, Math.max(1, h * 0.0022));
      for (var i = 0; i < 3; i++) {
        ctx.fillStyle = "rgba(26,27,29," + (0.22 - i * 0.05) + ")";
        ctx.fillRect(x + w * 0.22, y + art * 0.86 + i * h * 0.012, w * (0.42 - i * 0.09), 1.2);
      }
    } else if (seed === 1) {
      // 条带
      var widths = [0.12, 0.07, 0.18, 0.05, 0.1];
      var cx = x + w * 0.18;
      for (var b = 0; b < widths.length; b++) {
        ctx.fillStyle = b % 2 ? "rgba(26,27,29,.16)" : "rgba(26,27,29,.55)";
        ctx.fillRect(cx, y + h * 0.12, w * widths[b], h * 0.36);
        cx += w * widths[b] + w * 0.028;
      }
    } else if (seed === 2) {
      // 首字
      var ch = (book.title || "书").trim()[0] || "书";
      ctx.fillStyle = "rgba(26,27,29,.88)";
      ctx.font = '500 ' + (w * 0.55) + 'px ' + UI.FONT_SERIF;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(ch, x + w / 2, y + h * 0.27);
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "rgba(26,27,29,.28)";
      ctx.fillRect(x + w * 0.2, y + h * 0.455, w * 0.6, 1.4);
    } else if (seed === 3) {
      // 斜线
      ctx.strokeStyle = "rgba(26,27,29,.62)";
      ctx.lineWidth = 1.3;
      for (var d = 0; d < 9; d++) {
        ctx.beginPath();
        ctx.moveTo(x + w * (0.05 + d * 0.09), y + h * 0.5);
        ctx.lineTo(x + w * (0.35 + d * 0.09), y + h * 0.14);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(26,27,29,.85)";
      ctx.fillRect(x + w * 0.12, y + h * 0.44, w * 0.16, h * 0.022);
    } else {
      // 回声方框
      ctx.strokeStyle = "rgba(26,27,29,.55)";
      ctx.lineWidth = 1.3;
      for (var n = 0; n < 4; n++) {
        var inset = w * (0.11 + n * 0.062);
        ctx.strokeRect(x + inset, y + h * 0.1 + n * h * 0.02, w - inset * 2, h * 0.32 - n * h * 0.04);
      }
      ctx.fillStyle = "rgba(26,27,29,.9)";
      ctx.fillRect(x + w * 0.11, y + h * 0.1, w * 0.09, h * 0.32);
    }

    // 竖纹书脊
    ctx.fillStyle = "rgba(26,27,29,.10)";
    ctx.fillRect(x, y, Math.max(3, w * 0.018), h);
    ctx.fillStyle = "rgba(255,255,255,.30)";
    ctx.fillRect(x + Math.max(3, w * 0.018), y, 1, h);

    // 文本
    var tx = x + w * 0.11;
    var tw = w * 0.78;
    var titleSize = Math.max(20, Math.min(34, w * 0.105));
    var ty = y + (seed === 4 ? h * 0.52 : h * 0.63);
    setFont(titleSize, 500, UI.FONT_SERIF);
    ctx.fillStyle = c.ink;
    var rawTitle = book.title || "无题";
    var lines = wrapText(rawTitle, tw, 3);
    if (lines.join("").length < Array.from(rawTitle).length) {
      lines[lines.length - 1] = ellipsis(lines[lines.length - 1] + "…", tw);
    }
    for (var l = 0; l < lines.length; l++) {
      ctx.fillText(lines[l], tx, ty + l * titleSize * 1.28);
    }
    var authorY = y + h - Math.max(24, h * 0.075);
    ctx.fillStyle = c.soft;
    setFont(Math.max(12, w * 0.058), 400, UI.FONT_UI);
    var au = book.author || "";
    ctx.fillText(ellipsis(au, tw), tx, authorY);

    // 内框（印刷感的细线）
    ctx.strokeStyle = "rgba(26,27,29,.20)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + w * 0.055 + 0.5, y + h * 0.042 + 0.5, w * 0.89, h * 0.916);

    ctx.restore();
  }

  /** 供阅读器 Aa 面板里的小预览用 */
  UI.drawCover = drawCover;

  /* --------------------------------------------------------------- 书架 */

  function navBar(active) {
    var t = UI.theme();
    line(0, NAVY, W, NAVY, t.line2, 1);
    var items = [
      { k: "library", icon: "grid", label: "书库" },
      { k: "bookmarks", icon: "bookmark", label: "书签" },
      { k: "settings", icon: "gear", label: "设置" }
    ];
    for (var i = 0; i < items.length; i++) {
      var cx = W * (i + 0.5) / 3;
      var on = items[i].k === active;
      icon(items[i].icon, cx, 1349, 23, on ? t.ink : t.faint, 1.7);
      text(items[i].label, cx, 1383, {
        size: 16, color: on ? t.ink : t.faint, align: "center",
        weight: on ? "500" : "400"
      });
      (function (k) {
        hit(W * i / 3, NAVY, W / 3, H - NAVY, function () {
          if (UI.view !== k) { UI.view = k; UI.overlays.length = 0; UI.requestDraw(); }
        });
      })(items[i].k);
    }
  }
  UI.navBar = navBar;

  UI.drawLibrary = function () {
    var t = UI.theme();
    var books = sortedBooks();

    UI.statusBar();

    text("图书馆", 64, 150, { size: 54, weight: "500", stack: UI.FONT_SERIF, color: t.ink });

    // 视图切换
    icon(UI.settings.view === "grid" ? "list" : "grid", 740, 126, 24, t.sub, 1.7);
    hit(712, 100, 56, 52, function () {
      UI.settings.view = UI.settings.view === "grid" ? "list" : "grid";
      UI.scroll.library = 0;
      UI.hooks.saveSettings && UI.hooks.saveSettings();
      UI.requestDraw();
    });

    UI.button("＋ 导入", 788, 100, 172, 52, function () {
      UI.hooks.import && UI.hooks.import();
    }, { size: 21 });

    // 统计与排序
    var finished = books.filter(function (b) { return b.finished; }).length;
    text("共 " + books.length + " 本 · 已读完 " + finished + " 本", 64, 198, {
      size: 19, color: t.faint
    });

    var sortLabel = SORTS.filter(function (s) { return s.key === UI.settings.sort; })[0] || SORTS[0];
    text(sortLabel.label, 934, 198, { size: 19, color: t.sub, align: "right" });
    icon("chev", 948, 191, 14, t.sub, 1.5);
    hit(736, 170, 224, 44, function () {
      UI.open({ type: "sortMenu", x: 700, y: 214, w: 260 });
    });

    line(64, 228, 960, 228, t.line2, 1);

    if (UI.settings.view === "list") drawList(books);
    else drawGrid(books);

    navBar("library");
  };

  function drawGrid(books) {
    var t = UI.theme();
    var rows = Math.ceil((books.length + 1) / COLS);
    var contentH = rows * ROWH + 40;

    UI.scrollArea(GX, GY, GW, NAVY - GY - 8, "library", contentH, function (off) {
      for (var i = 0; i <= books.length; i++) {
        var r = Math.floor(i / COLS), c = i % COLS;
        var x = GX + c * (COLW + GAP);
        var y = GY - off + r * ROWH;
        if (y > NAVY + 60 || y + ROWH < GY - 60) continue;

        if (i === books.length) { drawAddTile(x, y); continue; }
        var b = books[i];
        drawCover(b, x, y, COLW, COVERH);

        // 进度
        var pw = UI.progressOf(b);
        ctx.fillStyle = t.line2;
        ctx.fillRect(x, y + COVERH + 13, COLW, 3);
        if (pw > 0) {
          ctx.fillStyle = t.ink;
          ctx.fillRect(x, y + COVERH + 13, COLW * pw, 3);
        }
        if (b.finished) {
          icon("check", x + COLW - 12, y + COVERH - 14, 18, t.ink, 2);
        }

        setFont(22, 500, UI.FONT_UI);
        ctx.fillStyle = t.ink;
        ctx.fillText(ellipsis(b.title, COLW - 6), x, y + COVERH + 52);

        setFont(17, 400, UI.FONT_UI);
        ctx.fillStyle = t.faint;
        ctx.fillText(ellipsis(b.author || "未知作者", COLW - 62), x, y + COVERH + 80);
        if (b.finished) {
          ctx.fillStyle = t.sub;
          setFont(17, 500, UI.FONT_UI);
          ctx.textAlign = "right";
          ctx.fillText("已读完", x + COLW, y + COVERH + 80);
          ctx.textAlign = "left";
        } else if (pw > 0.005) {
          ctx.fillStyle = t.sub;
          setFont(17, 500, UI.FONT_UI);
          ctx.textAlign = "right";
          ctx.fillText(Math.round(pw * 100) + "%", x + COLW, y + COVERH + 80);
          ctx.textAlign = "left";
        }
      }
    }, function (cx, cy) {
      var row = Math.floor((cy - GY) / ROWH);
      var col = Math.floor((cx - GX) / (COLW + GAP));
      var idx = row * COLS + col;
      if (col < 0 || col >= COLS) return;
      if (idx === books.length) { UI.hooks.import && UI.hooks.import(); return; }
      if (idx >= 0 && idx < books.length) openBook(books[idx]);
    }, function (cx, cy) {
      var row = Math.floor((cy - GY) / ROWH);
      var col = Math.floor((cx - GX) / (COLW + GAP));
      var idx = row * COLS + col;
      if (idx >= 0 && idx < books.length) UI.open({ type: "bookActions", bookId: books[idx].id });
    });

  }

  function drawAddTile(x, y) {
    var t = UI.theme();
    ctx.save();
    ctx.setLineDash([6, 7]);
    strokeRR(x, y, COLW, COVERH, 3, t.line, 1.2);
    ctx.restore();
    icon("plus", x + COLW / 2, y + COVERH / 2 - 22, 34, t.faint, 1.5);
    text("导入书籍", x + COLW / 2, y + COVERH / 2 + 44, {
      size: 19, color: t.faint, align: "center"
    });
    text("TXT / MD", x + COLW / 2, y + COVERH / 2 + 72, {
      size: 14, color: t.faint, align: "center"
    });
  }

  function drawList(books) {
    var t = UI.theme();
    var rowH = 128;
    var contentH = (books.length + 1) * rowH + 30;

    UI.scrollArea(64, GY, 896, NAVY - GY - 8, "library", contentH, function (off) {
      for (var i = 0; i <= books.length; i++) {
        var y = GY - off + i * rowH;
        if (y > NAVY + 40 || y + rowH < GY - 40) continue;
        if (i === books.length) {
          ctx.save();
          ctx.setLineDash([5, 6]);
          strokeRR(64, y + 8, 896, rowH - 18, 3, t.line, 1);
          ctx.restore();
          icon("plus", 112, y + rowH / 2 - 2, 22, t.faint, 1.5);
          text("导入书籍", 152, y + rowH / 2 + 5, { size: 20, color: t.faint });
          continue;
        }
        var b = books[i];
        if (i > 0) line(64, y, 960, y, t.line2, 1);
        drawCover(b, 70, y + 16, 68, 98);
        setFont(24, 500, UI.FONT_UI);
        ctx.fillStyle = t.ink;
        ctx.fillText(ellipsis(b.title, 480), 164, y + 52);
        setFont(17, 400, UI.FONT_UI);
        ctx.fillStyle = t.faint;
        ctx.fillText(ellipsis(b.author || "未知作者", 300), 164, y + 80);

        var pw = UI.progressOf(b);
        ctx.fillStyle = t.line2;
        ctx.fillRect(164, y + 98, 300, 2.5);
        ctx.fillStyle = t.ink;
        ctx.fillRect(164, y + 98, 300 * pw, 2.5);
        text(b.finished ? "已读完" : (pw > 0.005 ? Math.round(pw * 100) + "%" : "未开始"), 960, y + 71, {
          size: 18, color: t.sub, align: "right"
        });
        icon("chev", 950, y + 52, 14, t.faint, 1.4);
      }
    }, function (cx, cy) {
      var idx = Math.floor((cy - GY) / rowH);
      if (idx === books.length) { UI.hooks.import && UI.hooks.import(); return; }
      if (idx >= 0 && idx < books.length) openBook(books[idx]);
    }, function (cx, cy) {
      var idx = Math.floor((cy - GY) / rowH);
      if (idx >= 0 && idx < books.length) UI.open({ type: "bookActions", bookId: books[idx].id });
    });
  }

  function openBook(b) {
    UI.hooks.openBook && UI.hooks.openBook(b.id);
  }

  /* --------------------------------------------------------------- 书签汇总 */

  UI.drawAllBookmarks = function () {
    var t = UI.theme();
    UI.statusBar();
    text("书签", 64, 150, { size: 54, weight: "500", stack: UI.FONT_SERIF });
    text("所有书籍的标记，按时间排列", 66, 194, { size: 18, color: t.faint });
    line(64, 228, 960, 228, t.line2, 1);

    var items = [];
    UI.books.forEach(function (b) {
      (b.bookmarks || []).forEach(function (m) {
        items.push({ book: b, mark: m });
      });
    });
    items.sort(function (a, b) { return (b.mark.at || 0) - (a.mark.at || 0); });

    if (!items.length) {
      icon("bookmark", W / 2, 600, 46, t.line, 1.4);
      text("还没有书签", W / 2, 676, { size: 26, color: t.sub, align: "center" });
      text("阅读时轻点屏幕中间，选择「书签」即可标记当前页", W / 2, 716, {
        size: 17, color: t.faint, align: "center"
      });
      navBar("bookmarks");
      return;
    }

    var rowH = 150;
    UI.scrollArea(64, 252, 896, NAVY - 252 - 8, "allmarks", items.length * rowH + 30, function (off) {
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        var y = 252 - off + i * rowH;
        if (y > NAVY + 40 || y + rowH < 240) continue;
        if (i > 0) line(64, y, 960, y, t.line2, 1);
        icon("bookmarkFill", 82, y + 34, 20, t.ink, 1.5);
        setFont(23, 500, UI.FONT_UI);
        ctx.fillStyle = t.ink;
        ctx.fillText(ellipsis(it.mark.snippet || "（无内容）", 740), 108, y + 42);
        setFont(17, 400, UI.FONT_UI);
        ctx.fillStyle = t.faint;
        var meta = it.book.title + " · " + Math.round((it.mark.progress || 0) * 100) + "%";
        ctx.fillText(ellipsis(meta, 600), 108, y + 76);
        ctx.fillStyle = t.faint;
        ctx.textAlign = "right";
        ctx.fillText(relTime(it.mark.at), 960, y + 76);
        ctx.textAlign = "left";
        // 删除
        icon("close", 940, y + 34, 15, t.faint, 1.5);
      }
    }, function (cx, cy) {
      var idx = Math.floor((cy - 252) / rowH);
      if (idx < 0 || idx >= items.length) return;
      var it = items[idx];
      var rowTop = 252 + idx * rowH;
      if (cx > 912 && cy - rowTop < 56) {
        it.book.bookmarks = (it.book.bookmarks || []).filter(function (x) { return x !== it.mark; });
        UI.hooks.saveLibrary && UI.hooks.saveLibrary();
        UI.requestDraw();
        UI.toast("已删除书签");
        return;
      }
      UI.hooks.openBookAt && UI.hooks.openBookAt(it.book.id, it.mark.offset);
    });

    navBar("bookmarks");
  };

  function relTime(ts) {
    if (!ts) return "";
    var d = Date.now() - ts;
    if (d < 60e3) return "刚刚";
    if (d < 3600e3) return Math.floor(d / 60e3) + " 分钟前";
    if (d < 86400e3) return Math.floor(d / 3600e3) + " 小时前";
    if (d < 86400e3 * 30) return Math.floor(d / 86400e3) + " 天前";
    var dt = new Date(ts);
    return (dt.getMonth() + 1) + "月" + dt.getDate() + "日";
  }
  UI.relTime = relTime;

  /* --------------------------------------------------------------- 弹层 */

  UI.drawSortMenu = function (o) {
    var t = UI.theme();
    fillRR(o.x, o.y, o.w, 16 + SORTS.length * 58, 3, t.panel);
    strokeRR(o.x, o.y, o.w, 16 + SORTS.length * 58, 3, t.line, 1);
    for (var i = 0; i < SORTS.length; i++) {
      var y = o.y + 8 + i * 58;
      var on = UI.settings.sort === SORTS[i].key;
      text(SORTS[i].label, o.x + 24, y + 38, {
        size: 20, color: on ? t.ink : t.sub, weight: on ? "500" : "400"
      });
      if (on) icon("check", o.x + o.w - 28, y + 30, 16, t.ink, 1.8);
      (function (key) {
        hit(o.x + 8, y, o.w - 16, 58, function () {
          UI.settings.sort = key;
          UI.scroll.library = 0;
          UI.hooks.saveSettings && UI.hooks.saveSettings();
          UI.overlays.length = 0;
          UI.requestDraw();
        });
      })(SORTS[i].key);
    }
  };

  UI.drawBookActions = function (o) {
    var t = UI.theme();
    var b = UI.books.filter(function (x) { return x.id === o.bookId; })[0];
    if (!b) { UI.overlays.length = 0; return; }
    var x = 132, y = 470, w = 760, h = 442;
    fillRR(x, y, w, h, 4, t.panel);
    strokeRR(x, y, w, h, 4, t.line, 1);

    drawCover(b, x + 36, y + 36, 160, 234);
    setFont(31, 500, UI.FONT_SERIF);
    ctx.fillStyle = t.ink;
    var tl = wrapText(b.title, 490, 2);
    for (var i = 0; i < tl.length; i++) ctx.fillText(tl[i], x + 232, y + 78 + i * 40);
    text(b.author || "未知作者", x + 232, y + 172, { size: 19, color: t.sub });
    text(Math.round(UI.progressOf(b) * 100) + "% · " + (b.finished ? "已读完" : "阅读中"), x + 232, y + 208, {
      size: 18, color: t.faint
    });
    text((b.chars ? (b.chars / 1000).toFixed(1) + " 千字" : ""), x + 232, y + 240, {
      size: 18, color: t.faint
    });

    UI.button("继续阅读", x + 36, y + 330, 300, 56, function () {
      UI.overlays.length = 0;
      UI.hooks.openBook && UI.hooks.openBook(b.id);
    }, { primary: true, size: 21 });

    UI.button("删除", x + 356, y + 330, 150, 56, function () {
      UI.open({
        type: "confirm",
        title: "删除这本书？",
        body: "《" + b.title + "》将从设备中移除，阅读进度与书签也会一起消失。",
        yes: "删除",
        onYes: function () {
          UI.hooks.deleteBook && UI.hooks.deleteBook(b.id);
          UI.overlays.length = 0;
          UI.requestDraw();
        }
      });
    }, { size: 21 });

    UI.button("取消", x + 526, y + 330, 150, 56, function () {
      UI.overlays.length = 0;
      UI.requestDraw();
    }, { size: 21 });

    icon("close", x + w - 40, y + 36, 18, t.faint, 1.6);
    hit(x + w - 62, y + 14, 48, 48, function () {
      UI.overlays.length = 0;
      UI.requestDraw();
    });
  };

  UI.drawConfirm = function (o) {
    var t = UI.theme();
    var x = 192, y = 548, w = 640, h = 304;
    fillRR(x, y, w, h, 4, t.panel);
    strokeRR(x, y, w, h, 4, t.line, 1);
    text(o.title, x + 40, y + 74, { size: 30, weight: "500", stack: UI.FONT_SERIF });
    var lines = wrapText(o.body, w - 80, 3);
    for (var i = 0; i < lines.length; i++) {
      text(lines[i], x + 40, y + 122 + i * 32, { size: 19, color: t.sub });
    }
    UI.button("取消", x + 40, y + h - 92, 250, 54, function () {
      UI.overlays.pop();
      UI.requestDraw();
    }, { size: 21 });
    UI.button(o.yes || "确定", x + w - 290, y + h - 92, 250, 54, function () {
      if (o.onYes) o.onYes();
      UI.requestDraw();
    }, { primary: true, size: 21 });
  };

  UI.drawImporting = function (o) {
    var t = UI.theme();
    UI.overlayAbsorb(function () {});
    var w = 560, h = 200, x = (W - w) / 2, y = 600;
    fillRR(x, y, w, h, 4, t.panel);
    strokeRR(x, y, w, h, 4, t.line, 1);
    var ph = (performance.now() / 900) % 1;
    ctx.fillStyle = t.line2;
    ctx.fillRect(x + 48, y + h - 52, w - 96, 2);
    ctx.fillStyle = t.ink;
    ctx.fillRect(x + 48 + (w - 96 - 120) * ph, y + h - 52, 120, 2);
    text(o.text || "正在处理…", x + 48, y + 92, { size: 24, weight: "500", stack: UI.FONT_SERIF });
    text("墨水屏正在重排，请稍候", x + 48, y + 126, { size: 17, color: t.faint });
  };
})();
