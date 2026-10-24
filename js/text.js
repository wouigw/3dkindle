/* 排版引擎：章节识别、中英混排断行、分页、字符偏移定位 */
(function () {
  "use strict";

  var CJK_RE = /[\u1100-\u11ff\u2e80-\u9fff\ua960-\ua97f\uac00-\ud7ff\uf900-\ufaff\uff00-\uffef]/;
  var SPACE_RE = /\s/;
  var CLOSE_PUNCT = /^[，。、；：！？）》」』】〕…—,.!?;:)\]}”’·]$/;
  var OPEN_PUNCT = /^[（《「『【〔“‘(\[{]$/;
  var NO_INDENT_END = /[。！？…”』」]$/;

  var measureState = { key: "", map: new Map() };

  function makeMeasurer(ctx, fs, stack, weight) {
    var key = (weight || "400") + "|" + fs + "|" + stack;
    if (measureState.key !== key) {
      measureState = { key: key, map: new Map() };
    }
    var cache = measureState.map;
    ctx.font = (weight || "400") + " " + fs + "px " + stack;
    return function (s) {
      var v = cache.get(s);
      if (v === undefined) {
        v = ctx.measureText(s).width;
        cache.set(s, v);
      }
      return v;
    };
  }

  function isCJK(ch) { return CJK_RE.test(ch); }

  function tokenize(str) {
    var out = [];
    var i = 0;
    var n = str.length;
    while (i < n) {
      var ch = str[i];
      if (CJK_RE.test(ch)) {
        out.push({ t: ch, cjk: true, s: i, e: i + 1 });
        i++;
      } else if (SPACE_RE.test(ch)) {
        var j = i;
        while (j < n && SPACE_RE.test(str[j])) j++;
        out.push({ t: str.slice(i, j), space: true, s: i, e: j });
        i = j;
      } else {
        var k = i;
        while (k < n && !SPACE_RE.test(str[k]) && !CJK_RE.test(str[k])) k++;
        if (k === i) k = i + 1;
        out.push({ t: str.slice(i, k), s: i, e: k });
        i = k;
      }
    }
    return out;
  }

  function isHeadingLine(line) {
    var t = line.trim();
    if (!t || t.length > 48) return false;
    if (/[，。；、,;]$/.test(t)) return false;
    if (/^第\s*[0-9零〇一二三四五六七八九十百千万两]+\s*[章节回卷篇部集折]/.test(t)) return true;
    if (/^(序|序言|自序|前言|引言|楔子|引子|后记|尾声|终章|番外|跋|目录)(\s|$|[：:·—])/.test(t)) return true;
    if (/^(chapter|part|book|prologue|epilogue|preface)\b/i.test(t)) return true;
    if (/^[一二三四五六七八九十百]+[、.．]\s*\S/.test(t)) return true;
    if (/^\d{1,3}[、.．]\s*\S/.test(t)) return true;
    if (/^[（(][一二三四五六七八九十]+[）)]\s*\S/.test(t)) return true;
    return false;
  }

  function splitChapters(text) {
    var lines = text.split("\n");
    var out = [];
    var pos = 0;
    for (var i = 0; i < lines.length; i++) {
      var raw = lines[i];
      if (isHeadingLine(raw)) out.push({ title: raw.trim(), start: pos, page: 0 });
      pos += raw.length + 1;
    }
    if (!out.length) {
      out = [{ title: "正文", start: 0, page: 0 }];
    } else if (out[0].start > 0) {
      out.unshift({ title: "序", start: 0, page: 0 });
    }
    for (var k = 0; k < out.length; k++) {
      out[k].end = k + 1 < out.length ? out[k + 1].start : text.length;
    }
    return out;
  }

  /* 单段断行：返回行对象数组（不含分页） */
  function wrapParagraph(par, indentW, maxW, fs, measure) {
    var tokens = tokenize(par);
    var lines = [];
    var cur = [];
    var w = indentW;
    var brk = 0;
    var first = true;

    var sumWidth = function (arr) {
      var s = 0;
      for (var i = 0; i < arr.length; i++) s += arr[i].w;
      return s;
    };
    var recalcBreak = function (arr) {
      var b = 0;
      for (var i = 0; i < arr.length; i++) if (arr[i].cjk || arr[i].space) b = i + 1;
      return b;
    };
    var push = function (arr) {
      if (!arr.length) return;
      var txt = arr.map(function (t) { return t.t; }).join("").replace(/\s+$/, "");
      if (!txt) return;
      lines.push({
        text: txt,
        indent: first,
        heading: false,
        last: false,
        start: arr[0].s,
        end: arr[arr.length - 1].e,
        w: sumWidth(arr)
      });
      first = false;
    };

    for (var i = 0; i < tokens.length; i++) {
      var tk = tokens[i];
      if (!cur.length && tk.space) continue;
      tk.w = measure(tk.t);

      if (!cur.length && w + tk.w > maxW + 0.01 && tk.t.length > 1) {
        var chars = [];
        var acc = tk.s;
        Array.from(tk.t).forEach(function (c) {
          chars.push({ t: c, cjk: isCJK(c), s: acc, e: acc + c.length });
          acc += c.length;
        });
        tokens.splice.apply(tokens, [i, 1].concat(chars));
        i--;
        continue;
      }

      if (w + tk.w > maxW + 0.01 && cur.length) {
        var lastTk = cur[cur.length - 1];
        if (CLOSE_PUNCT.test(tk.t) && w + tk.w - maxW <= fs * 0.62) {
          cur.push(tk); w += tk.w; brk = cur.length; i++; continue;
        }
        if (OPEN_PUNCT.test(lastTk.t) && cur.length > 1) {
          var moved = cur.pop();
          w -= moved.w;
          push(cur);
          cur = [moved];
          w = moved.w;
          brk = 0;
          i--;
          continue;
        }
        if (brk > 0) {
          var head = cur.slice(0, brk);
          var tail = cur.slice(brk);
          push(head);
          cur = tail;
          w = sumWidth(tail);
          brk = recalcBreak(tail);
          i--;
          continue;
        }
        push(cur);
        cur = [];
        w = 0;
        brk = 0;
        i--;
        continue;
      }

      cur.push(tk);
      w += tk.w;
      if (tk.cjk || tk.space) brk = cur.length;
    }
    push(cur);

    if (lines.length) lines[lines.length - 1].last = true;
    return lines;
  }

  /**
   * 生成整本书的版式
   * cfg: { width, height, fontSize, lineHeight, fontStack, weight, indent, align, ctx }
   */
  function build(text, cfg) {
    var fs = cfg.fontSize;
    var lineH = fs * cfg.lineHeight;
    var measure = makeMeasurer(cfg.ctx, fs, cfg.fontStack, cfg.weight || "400");
    var chapters = splitChapters(text);
    var chapterAt = {};
    for (var c = 0; c < chapters.length; c++) chapterAt[chapters[c].start] = c;

    var pages = [];
    var pageLines = [];
    var y = 0;
    var pageH = cfg.height;
    var offset = 0;
    var srcLines = text.split("\n");

    var finishPage = function () {
      if (!pageLines.length) return;
      var firstL = pageLines[0];
      var lastL = pageLines[pageLines.length - 1];
      pages.push({
        lines: pageLines,
        start: firstL.start,
        end: lastL.end,
        chap: firstL.chap,
        top: firstL.top
      });
      pageLines = [];
      y = 0;
    };

    for (var i = 0; i < srcLines.length; i++) {
      var raw = srcLines[i];
      var paraStart = offset;
      offset += raw.length + 1;
      var para = raw;
      if (!para.trim()) continue;

      var chapIdx = chapterAt[paraStart];
      var isHead = chapIdx !== undefined;
      var isCJKPara = isCJK(para.trim()[0] || "");
      var verse = para.trim().length < 60 && !NO_INDENT_END.test(para.trim());
      var indentW = isHead ? 0 : (cfg.indent && !verse ? fs * (isCJKPara ? 2 : 1.55) : 0);

      var lines = wrapParagraph(para, indentW, cfg.width, fs, measure);

      for (var j = 0; j < lines.length; j++) {
        var ln = lines[j];
        ln.start += paraStart;
        ln.end += paraStart;
        ln.chap = chapIdx !== undefined ? chapIdx : currentChapter(chapters, paraStart);
        ln.heading = !!isHead;
        ln.h = lineH;
        ln.gap = 0;
        ln.spaceBefore = 0;
        if (isHead) {
          ln.h = fs * cfg.lineHeight * 1.06;
          if (j === 0) ln.spaceBefore = fs * 1.05;
          if (j === lines.length - 1) ln.gap = fs * 0.85;
        } else if (j === lines.length - 1) {
          ln.gap = fs * 0.32;
        }

        // 章标题不落在页脚：至少留出两行正文
        if (isHead && j === 0 && pageLines.length) {
          var need = ln.spaceBefore + ln.h + ln.gap + lineH * 1.7;
          if (y + need > pageH) finishPage();
        }
        var extra = pageLines.length ? ln.spaceBefore : 0;
        if (y + extra + ln.h + ln.gap > pageH + 0.5 && pageLines.length) {
          finishPage();
          extra = 0;
        }
        if (chapters[ln.chap] && !chapters[ln.chap]._placed) {
          chapters[ln.chap].page = pages.length;
          chapters[ln.chap]._placed = true;
        }
        ln.top = y + extra;
        y += extra + ln.h + ln.gap;
        pageLines.push(ln);
      }
    }
    finishPage();

    for (var k = 0; k < chapters.length; k++) delete chapters[k]._placed;
    if (!pages.length) {
      pages.push({ lines: [], start: 0, end: 0, chap: 0, top: 0 });
    }
    return {
      pages: pages,
      chapters: chapters,
      text: text,
      textLength: text.length,
      cfg: cfg
    };
  }

  function currentChapter(chapters, pos) {
    for (var i = chapters.length - 1; i >= 0; i--) {
      if (pos >= chapters[i].start) return i;
    }
    return 0;
  }

  function pageForOffset(layout, offset) {
    var pages = layout.pages;
    if (!pages.length) return 0;
    var lo = 0, hi = pages.length - 1;
    while (lo < hi) {
      var mid = (lo + hi) >> 1;
      if (pages[mid].end <= offset) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  window.Engine = {
    build: build,
    splitChapters: splitChapters,
    pageForOffset: pageForOffset,
    tokenize: tokenize,
    makeMeasurer: makeMeasurer,
    isHeadingLine: isHeadingLine
  };
})();
