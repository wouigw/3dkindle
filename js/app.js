/* 应用装配：启动、导入、排版调度、阅读计时、外框交互 */
(function () {
  "use strict";
  var UI = window.UI;
  var Store = window.Store;
  var Engine = window.Engine;
  var Scene = window.Scene;

  var uiCanvas = document.createElement("canvas");
  var bootT = 0;
  var booted = false;
  var bootStart = performance.now();
  var readSeconds = 0;
  var lastStatsSave = 0;
  var lastFrameTs = 0;
  var saveLibT = null;
  var saveSetT = null;
  var focused = false;

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function outerToast(msg) {
    var el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.add("on");
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove("on"); }, 2600);
  }

  function saveSettings() {
    clearTimeout(saveSetT);
    saveSetT = setTimeout(function () {
      Store.saveSettings(UI.settings);
      Scene.setLight(UI.settings.brightness, UI.settings.warmth);
    }, 120);
  }

  function saveLibrary() {
    clearTimeout(saveLibT);
    saveLibT = setTimeout(function () { Store.saveLibrary(UI.books); }, 220);
  }

  function flush() {
    Store.saveLibrary(UI.books);
    Store.saveSettings(UI.settings);
  }

  /* --------------------------------------------------------- 打开与排版 */

  async function openBookAt(id, offset) {
    var book = UI.books.filter(function (b) { return b.id === id; })[0];
    if (!book) return;
    UI.overlays.length = 0;
    UI.open({ type: "importing", text: "正在展开《" + book.title + "》" });
    UI.requestDraw();
    await sleep(80);

    var text = await Store.readText(id);
    if (!text) {
      UI.overlays.length = 0;
      UI.toast("找不到这本书的正文");
      return;
    }
    var cfg = UI.readerCfg();
    var layout;
    try {
      layout = Engine.build(text, cfg);
    } catch (err) {
      console.error(err);
      UI.overlays.length = 0;
      UI.toast("排版失败，文件可能已损坏");
      return;
    }
    book.chars = text.length;
    if (offset != null) book.offset = offset;
    UI.enterReader(book, layout);
    UI.overlays.length = 0;
    UI.requestDraw();
    if (UI.settings.flash) Scene.flash();
    UI.savePosition();
  }

  function relayout() {
    if (!UI.layout || !UI.book) return;
    var cur = UI.layout.pages[UI.page];
    var offset = cur ? cur.start : (UI.book.offset || 0);
    var cfg = UI.readerCfg();
    var layout = Engine.build(UI.layout.text, cfg);
    UI.layout = layout;
    UI.page = Engine.pageForOffset(layout, offset);
    UI.book.offset = layout.pages[UI.page] ? layout.pages[UI.page].start : offset;
    UI.settings.signature = UI.layoutSig();
    saveSettings();
    UI.requestDraw();
  }

  async function importFiles(files) {
    if (!files || !files.length) return;
    UI.open({ type: "importing", text: "正在读入文件…" });
    UI.requestDraw();
    await sleep(60);
    var res = await Store.importFiles(files);
    UI.overlays.length = 0;
    var added = 0, lastTitle = "", errs = [];
    res.forEach(function (r) {
      if (r.book) {
        UI.books.unshift(r.book);
        added++;
        lastTitle = r.book.title;
      } else if (r.error) errs.push(r.error);
    });
    if (added) {
      Store.saveLibrary(UI.books);
      UI.scroll.library = 0;
      if (UI.view !== "reader") UI.view = "library";
      UI.toast(added > 1 ? "已导入 " + added + " 本书" : "已导入《" + lastTitle + "》");
      outerToast(added > 1 ? "已导入 " + added + " 本书" : "已导入《" + lastTitle + "》");
    } else {
      UI.toast(errs[0] || "没有找到可导入的 TXT 文件");
      outerToast(errs[0] || "没有找到可导入的 TXT 文件");
    }
    UI.requestDraw();
  }

  /* --------------------------------------------------------- 装配 */

  async function boot() {
    var settings = Store.loadSettings();
    var books = await Store.init();

    UI.init(uiCanvas, {
      books: books,
      settings: settings,
      hooks: {
        saveSettings: saveSettings,
        saveLibrary: saveLibrary,
        light: function () {
          Scene.setLight(UI.settings.brightness, UI.settings.warmth);
          saveSettings();
        },
        import: function () {
          document.getElementById("fileInput").click();
        },
        openBook: function (id) { openBookAt(id, null); },
        openBookAt: function (id, off) { openBookAt(id, off); },
        relayout: relayout,
        leaveReader: function () {
          UI.savePosition();
          UI.book = null;
          UI.layout = null;
        },
        deleteBook: function (id) {
          UI.books = UI.books.filter(function (b) { return b.id !== id; });
          Store.removeBook(id);
          Store.saveLibrary(UI.books);
          UI.requestDraw();
          outerToast("已从设备中删除");
        },
        progress: function () {
          saveLibrary();
        },
        restoreSamples: function () {
          var existing = {};
          UI.books.forEach(function (b) { existing[b.id] = true; });
          var seeds = Store.seedLibrary();
          var added = 0;
          seeds.forEach(function (s) {
            if (!existing[s.id]) { UI.books.push(s); added++; }
          });
          Store.saveLibrary(UI.books);
          UI.requestDraw();
          outerToast(added ? "已恢复 " + added + " 本样书" : "样书都在书架上");
        },
        clearAll: function () {
          UI.books = Store.clearAll();
          Store.saveLibrary(UI.books);
          UI.settings = Store.loadSettings();
          Store.saveSettings(UI.settings);
          Scene.setLight(UI.settings.brightness, UI.settings.warmth);
          UI.view = "library";
          UI.book = null;
          UI.layout = null;
          UI.overlays.length = 0;
          UI.scroll = { library: 0, toc: 0, marks: 0, allmarks: 0 };
          UI.requestDraw();
          outerToast("已清空所有数据");
        }
      }
    });

    Scene.init();
    Scene.setLight(settings.brightness, settings.warmth);
    Scene.start(function (dt) {
      if (UI.view === "boot") {
        bootT = (performance.now() - bootStart) / 1000;
        UI.bootP = Math.min(1, bootT / 1.35);
        UI.requestDraw();
        if (bootT >= 1.55 && !booted) {
          booted = true;
          UI.view = "library";
          UI.requestDraw();
          Scene.flash();
          document.getElementById("loader").classList.add("is-hidden");
          if (Store.memoryOnly) {
            setTimeout(function () {
              outerToast("浏览器限制了本地存储，导入的书仅在本次会话有效");
            }, 900);
          }
        }
      }
      if (UI.view === "reader" && !document.hidden) {
        var ns = performance.now();
        var real = lastFrameTs ? Math.min(2, (ns - lastFrameTs) / 1000) : 0;
        lastFrameTs = ns;
        readSeconds += real;
        UI.settings.stats.seconds = (UI.settings.stats.seconds || 0) + real;
        if (ns - lastStatsSave > 20000) {
          lastStatsSave = ns;
          saveSettings();
        }
      } else {
        lastFrameTs = 0;
      }
    });

    setTimeout(function () {
      document.getElementById("loader").classList.add("is-hidden");
    }, 900);

    setTimeout(function () {
      if (Store.memoryOnly) outerToast("本地存储不可用：导入的书仅在本次会话有效");
    }, 2400);

    wireOuter();
    wireKeyboard();
    wireBattery();
    UI.savePosition();

    setInterval(function () {
      if (UI.view !== "boot" && !UI.overlays.length) UI.requestDraw();
    }, 30000);
  }

  /* --------------------------------------------------------- 外框 */

  function wireOuter() {
    var fileInput = document.getElementById("fileInput");
    document.getElementById("btnImport").addEventListener("click", function () {
      fileInput.click();
    });
    fileInput.addEventListener("change", function () {
      var picked = Array.prototype.slice.call(fileInput.files || []);
      fileInput.value = "";
      importFiles(picked);
    });

    var focusBtn = document.getElementById("btnFocus");
    focusBtn.addEventListener("click", function () {
      focused = !focused;
      if (focused) { Scene.focus(); focusBtn.textContent = "退出聚焦"; }
      else { Scene.reset(); focusBtn.textContent = "聚焦阅读"; }
    });
    document.getElementById("btnReset").addEventListener("click", function () {
      focused = false;
      focusBtn.textContent = "聚焦阅读";
      Scene.reset();
    });
    var fullBtn = document.getElementById("btnFull");
    fullBtn.addEventListener("click", function () {
      if (document.fullscreenElement) {
        document.exitFullscreen && document.exitFullscreen();
      } else {
        document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(function () {});
      }
    });
    document.addEventListener("fullscreenchange", function () {
      fullBtn.classList.toggle("on", !!document.fullscreenElement);
    });

    var mask = document.getElementById("dropMask");
    var depth = 0;
    window.addEventListener("dragenter", function (e) {
      e.preventDefault();
      depth++;
      mask.classList.add("on");
    });
    window.addEventListener("dragover", function (e) { e.preventDefault(); });
    window.addEventListener("dragleave", function (e) {
      e.preventDefault();
      depth = Math.max(0, depth - 1);
      if (!depth) mask.classList.remove("on");
    });
    window.addEventListener("drop", function (e) {
      e.preventDefault();
      depth = 0;
      mask.classList.remove("on");
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
        importFiles(e.dataTransfer.files);
      }
    });

    window.addEventListener("beforeunload", flush);
  }

  function wireKeyboard() {
    window.addEventListener("keydown", function (e) {
      var tag = (e.target && e.target.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "Escape") {
        if (UI.overlays.length || UI.view !== "library") UI.back();
        return;
      }
      if (UI.view !== "reader" || UI.overlays.length) return;
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        UI.turn(1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        UI.turn(-1);
      } else if (e.key.toLowerCase() === "m") {
        UI.open({ type: "readerMenu" });
      }
    });
  }

  function wireBattery() {
    if (navigator.getBattery) {
      navigator.getBattery().then(function (b) {
        UI._battery = b.level;
        b.addEventListener && b.addEventListener("levelchange", function () {
          UI._battery = b.level;
          UI.requestDraw();
        });
        UI.requestDraw();
      }).catch(function () {});
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
