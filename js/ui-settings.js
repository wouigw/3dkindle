/* 设置页 */
(function () {
  "use strict";
  var UI = window.UI;
  var W = 1024;

  UI.drawSettings = function () {
    var t = UI.theme();
    var s = UI.settings;

    UI.statusBar();
    text("设置", 64, 150, { size: 54, weight: "500", stack: UI.FONT_SERIF });
    text("设备、阅读与本地数据", 66, 194, { size: 18, color: t.faint });
    line(64, 228, 960, 228, t.line2, 1);

    /* 光线 */
    UI.sectionLabel("光线与显示", 268);
    labelRow("亮度", 322, Math.round((s.brightness - 0.55) / 0.7 * 100) + "%");
    UI.slider(64, 352, 896, s.brightness, 0.55, 1.25, 0.01, function (v) {
      s.brightness = v;
      UI.hooks.light && UI.hooks.light();
      UI.requestDraw();
    }, saveSettings);

    labelRow("色温", 404, s.warmth > 0.66 ? "暖光" : (s.warmth > 0.33 ? "中性" : "冷白"));
    UI.slider(64, 434, 896, s.warmth, 0, 1, 0.01, function (v) {
      s.warmth = v;
      UI.hooks.light && UI.hooks.light();
      UI.requestDraw();
    }, saveSettings);

    labelRow("翻页刷新", 486, null);
    text("轻点屏幕中间唤出菜单，再点 Aa 可调整阅读排版。", 64, 512, { size: 16, color: t.faint });
    UI.toggle(894, 468, s.flash, function (v) {
      s.flash = v;
      saveSettings();
      if (v && window.Scene) window.Scene.flash();
      UI.requestDraw();
    });

    /* 阅读 */
    UI.sectionLabel("阅读", 558);
    labelRow("默认字号", 612, s.fontSize);
    UI.slider(64, 642, 896, s.fontSize, 26, 48, 1, function (v) {
      s.fontSize = v;
      UI.requestDraw();
    }, saveSettings);

    labelRow("主题", 694, null);
    UI.segmented(520, 670, 440, 48, ["纸白", "米黄", "夜间"],
      ["paper", "sepia", "night"].indexOf(s.theme), function (i) {
        s.theme = ["paper", "sepia", "night"][i];
        saveSettings();
        UI.requestDraw();
      }, 19);

    labelRow("首行缩进", 766, null);
    UI.toggle(894, 748, s.indent, function (v) {
      s.indent = v;
      saveSettings();
      UI.requestDraw();
    });

    /* 数据 */
    UI.sectionLabel("数据", 832);
    var chars = 0;
    UI.books.forEach(function (b) { chars += b.chars || 0; });
    var kb = Math.max(0.1, chars * 2 / 1024);
    var sizeText = kb >= 1024 ? (kb / 1024).toFixed(1) + " MB" : kb.toFixed(1) + " KB";
    text("本地书籍", 64, 880, { size: 19, color: t.sub });
    text(UI.books.length + " 本 · " + sizeText, 960, 880, { size: 19, color: t.ink, align: "right" });

    var mins = Math.round((s.stats && s.stats.seconds || 0) / 60);
    var finished = UI.books.filter(function (b) { return b.finished; }).length;
    text("累计阅读", 64, 914, { size: 19, color: t.sub });
    text(mins + " 分钟 · 读完 " + finished + " 本", 960, 914, { size: 19, color: t.ink, align: "right" });

    UI.button("恢复样书", 420, 940, 240, 54, function () {
      UI.hooks.restoreSamples && UI.hooks.restoreSamples();
      UI.requestDraw();
    }, { size: 19 });
    UI.button("清空数据", 680, 940, 280, 54, function () {
      UI.open({
        type: "confirm",
        title: "清空所有数据？",
        body: "所有书籍、阅读进度与书签都会被删除，设置也会恢复初始状态。此操作不可撤销。",
        yes: "清空",
        onYes: function () {
          UI.hooks.clearAll && UI.hooks.clearAll();
        }
      });
    }, { size: 19 });

    /* 关于 */
    UI.sectionLabel("关于", 1036);
    text("Kindle 3D · 墨水屏阅读器", 64, 1084, { size: 22, weight: "500", stack: UI.FONT_SERIF });
    text("版本 1.0 · Three.js 实时渲染", 64, 1116, { size: 17, color: t.faint });
    text("所有数据只保存在这台设备的浏览器里，不会上传到任何服务器。", 64, 1148, {
      size: 17, color: t.faint
    });
    text("我们尽量还原了电子墨水的对比度、颗粒与整屏刷新的迟钝感。", 64, 1178, {
      size: 17, color: t.faint
    });

    UI.navBar("settings");
  };

  function saveSettings() {
    UI.hooks.saveSettings && UI.hooks.saveSettings();
  }

  function labelRow(label, y, value) {
    var t = UI.theme();
    text(label, 64, y, { size: 21, color: t.ink });
    if (value != null) {
      text(String(value), 960, y, { size: 20, color: t.sub, align: "right" });
    }
  }
})();
