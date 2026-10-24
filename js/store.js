/* 数据层：书籍元数据、正文存储、设置、样书、导入解析 */
(function () {
  "use strict";

  var LIB_KEY = "kindle3d.library.v1";
  var SET_KEY = "kindle3d.settings.v1";
  var DB_NAME = "kindle3d";
  var DB_VER = 1;

  /* ---------------------------------------------------------------- 样书 */

  var SAMPLES = [
    {
      id: "sample-taohua",
      title: "桃花源记",
      author: "陶渊明",
      seed: 1207,
      text: [
        "晋太元中，武陵人捕鱼为业。缘溪行，忘路之远近。忽逢桃花林，夹岸数百步，中无杂树，芳草鲜美，落英缤纷。渔人甚异之，复前行，欲穷其林。",
        "林尽水源，便得一山，山有小口，仿佛若有光。便舍船，从口入。初极狭，才通人。复行数十步，豁然开朗。土地平旷，屋舍俨然，有良田、美池、桑竹之属。阡陌交通，鸡犬相闻。其中往来种作，男女衣着，悉如外人。黄发垂髫，并怡然自乐。",
        "见渔人，乃大惊，问所从来。具答之。便要还家，设酒杀鸡作食。村中闻有此人，咸来问讯。自云先世避秦时乱，率妻子邑人来此绝境，不复出焉，遂与外人间隔。问今是何世，乃不知有汉，无论魏晋。此人一一为具言所闻，皆叹惋。余人各复延至其家，皆出酒食。停数日，辞去。此中人语云：“不足为外人道也。”",
        "既出，得其船，便扶向路，处处志之。及郡下，诣太守，说如此。太守即遣人随其往，寻向所志，遂迷，不复得路。",
        "南阳刘子骥，高尚士也，闻之，欣然规往。未果，寻病终。后遂无问津者。"
      ].join("\n\n")
    },
    {
      id: "sample-chibi",
      title: "前赤壁赋",
      author: "苏轼",
      seed: 3311,
      text: [
        "壬戌之秋，七月既望，苏子与客泛舟游于赤壁之下。清风徐来，水波不兴。举酒属客，诵明月之诗，歌窈窕之章。少焉，月出于东山之上，徘徊于斗牛之间。白露横江，水光接天。纵一苇之所如，凌万顷之茫然。浩浩乎如冯虚御风，而不知其所止；飘飘乎如遗世独立，羽化而登仙。",
        "于是饮酒乐甚，扣舷而歌之。歌曰：“桂棹兮兰桨，击空明兮溯流光。渺渺兮予怀，望美人兮天一方。”客有吹洞箫者，倚歌而和之。其声呜呜然，如怨如慕，如泣如诉；余音袅袅，不绝如缕。舞幽壑之潜蛟，泣孤舟之嫠妇。",
        "苏子愀然，正襟危坐而问客曰：“何为其然也？”客曰：“‘月明星稀，乌鹊南飞’，此非曹孟德之诗乎？西望夏口，东望武昌，山川相缪，郁乎苍苍，此非孟德之困于周郎者乎？方其破荆州，下江陵，顺流而东也，舳舻千里，旌旗蔽空，酾酒临江，横槊赋诗，固一世之雄也，而今安在哉？况吾与子渔樵于江渚之上，侣鱼虾而友麋鹿，驾一叶之扁舟，举匏樽以相属。寄蜉蝣于天地，渺沧海之一粟。哀吾生之须臾，羡长江之无穷。挟飞仙以遨游，抱明月而长终。知不可乎骤得，托遗响于悲风。”",
        "苏子曰：“客亦知夫水与月乎？逝者如斯，而未尝往也；盈虚者如彼，而卒莫消长也。盖将自其变者而观之，则天地曾不能以一瞬；自其不变者而观之，则物与我皆无尽也，而又何羡乎！且夫天地之间，物各有主，苟非吾之所有，虽一毫而莫取。惟江上之清风，与山间之明月，耳得之而为声，目遇之而成色，取之无禁，用之不竭。是造物者之无尽藏也，而吾与子之所共适。”",
        "客喜而笑，洗盏更酌。肴核既尽，杯盘狼籍。相与枕藉乎舟中，不知东方之既白。"
      ].join("\n\n")
    },
    {
      id: "sample-oz",
      title: "The Wonderful Wizard of Oz",
      author: "L. Frank Baum",
      seed: 8123,
      text: [
        "Chapter I. The Cyclone",
        "Dorothy lived in the midst of the great Kansas prairies, with Uncle Henry, who was a farmer, and Aunt Em, who was the farmer's wife. Their house was small, for the lumber to build it had to be carried by wagon many miles. There were four walls, a floor and a roof, which made one room; and this room contained a rusty looking cookstove, a cupboard for the dishes, a table, three or four chairs, and the beds. Uncle Henry and Aunt Em had a big bed in one corner, and Dorothy a little bed in another corner. There was no garret at all, and no cellar—except a small hole dug in the ground, called a cyclone cellar, where the family could go in case one of those great whirlwinds arose, mighty enough to crush any building in its path. It was reached by a trap door in the middle of the floor, from which a ladder led down into the small, dark hole.",
        "When Dorothy stood in the doorway and looked around, she could see nothing but the great gray prairie on every side. Not a tree nor a house broke the broad sweep of flat country that reached to the edge of the sky in all directions. The sun had baked the plowed land into a gray mass, with little cracks running through it. Even the grass was not green, for the sun had burned the tops of the long blades until they were the same gray color to be seen everywhere. Once the house had been painted, but the sun blistered the paint and the rains washed it away, and now the house was as dull and gray as everything else.",
        "When Aunt Em came there to live she was a young, pretty wife. The sun and wind had changed her, too. They had taken the sparkle from her eyes and left them a sober gray; they had taken the red from her cheeks and lips, and they were gray also. She was thin and gaunt, and never smiled now. When Dorothy, who was an orphan, first came to her, Aunt Em had been so startled by the child's laughter that she would scream and press her hand upon her heart whenever Dorothy's merry voice reached her ears; and she still looked at the little girl with wonder that she could find anything to laugh at.",
        "It was Toto that made Dorothy laugh, and saved her from growing as gray as her other surroundings. Toto was not gray; he was a little black dog, with long silky hair and small black eyes that twinkled merrily on either side of his funny, wee nose. Toto played all day long, and Dorothy played with him, and loved him dearly.",
        "Uncle Henry sat upon the doorstep and looked anxiously at the sky, which was even grayer than usual. Dorothy stood in the door with Toto in her arms, and looked at the sky too. Aunt Em was washing the dishes.",
        "From the far north they heard a low wail of the wind, and Uncle Henry and Dorothy could see where the long grass bowed in waves before the coming storm. There now came a sharp whistling in the air from the south, and as they turned their eyes that way they saw ripples in the grass coming from that direction also.",
        "Suddenly Uncle Henry stood up. “There's a cyclone coming, Em,” he called to his wife. “I'll go look after the stock.” Then he ran toward the sheds where the cows and horses were kept.",
        "Aunt Em dropped her work and came to the door. One glance told her of the danger close at hand. “Quick, Dorothy!” she screamed. “Run for the cellar!”",
        "Toto jumped out of Dorothy's arms and hid under the bed, and the girl started to get him. Aunt Em, badly frightened, threw open the trap door in the floor and climbed down the ladder into the small, dark hole. Dorothy caught Toto at last and started to follow her aunt. When she was halfway across the room there came a great shriek from the wind, and the house shook so hard that she lost her footing and sat down suddenly upon the floor."
      ].join("\n\n")
    },
    {
      id: "sample-road",
      title: "The Road Not Taken",
      author: "Robert Frost",
      seed: 4477,
      text: [
        "Two roads diverged in a yellow wood,",
        "And sorry I could not travel both",
        "And be one traveler, long I stood",
        "And looked down one as far as I could",
        "To where it bent in the undergrowth;",
        "",
        "Then took the other, as just as fair,",
        "And having perhaps the better claim,",
        "Because it was grassy and wanted wear;",
        "Though as for that the passing there",
        "Had worn them really about the same,",
        "",
        "And both that morning equally lay",
        "In leaves no step had trodden black.",
        "Oh, I kept the first for another day!",
        "Yet knowing how way leads on to way,",
        "I doubted if I should ever come back.",
        "",
        "I shall be telling this with a sigh",
        "Somewhere ages and ages hence:",
        "Two roads diverged in a wood, and I—",
        "I took the one less traveled by,",
        "And that has made all the difference."
      ].join("\n")
    },
    {
      id: "sample-guide",
      title: "这台设备的使用说明",
      author: "随设备附赠",
      seed: 9021,
      text: [
        "一、它是什么",
        "这不是一台真正的 Kindle。它是一块在 Three.js 里搭起来的设备：有厚度，有倒角，有一层会把光揉散的玻璃，还有一块按真实纸张色温发亮的墨水屏。它不连接书店，也不会上传任何东西，但它确实能装下你的书。",
        "二、把书放进来",
        "点击书架右上角的「＋ 导入」，或者把 .txt / .md 文件拖到窗口的任意位置。程序会自动识别 UTF-8、GBK 与 UTF-16 编码，并按文件名猜测书名和作者——命名为《书名》作者.txt 会猜得更准。导入的书籍保存在浏览器本地，刷新页面不会丢失。",
        "三、翻页与手势",
        "轻点屏幕右侧翻到下一页，轻点左侧回到上一页，轻点中间唤出工具栏。键盘的左右方向键同样可以翻页，Esc 返回上一层。在书架上按住一本书不放，可以调出它的操作菜单。",
        "四、排版",
        "阅读时点击中间的「Aa」，可以更换字体、字号、行距、页边距与对齐方式。字号与行距会立刻重新排版，并且停留在你正在读的那一行，不会把你甩回第一章。",
        "五、目录、书签与进度",
        "程序会自动识别「第一章」「Chapter I」「一、」这样的章节标题并生成目录。点击顶部「目录」可以跳转，点击「书签」可以为当前这页做标记。所有书签都汇总在书架底部的「书签」标签中，可以跨书查看。",
        "六、光线",
        "设置里的亮度与色温会真实地作用在这台设备上。把色温推到最暖，屏幕会泛出旧纸一样的橘黄；把亮度调低，它会像真的关掉了前光灯一样暗下去。夜间主题把纸与墨整个反过来，适合在没有灯的房间里读。",
        "七、把玩它",
        "拖动空白处可以旋转视角，滚轮缩放。右上角的「聚焦阅读」会让镜头贴近屏幕，这时它更像一台真正的阅读器，而不是一件陈列品。「复位视角」总是能把你带回来。",
        "八、关于你的数据",
        "书籍、进度、书签和阅读时长都只存在于这台设备的浏览器里。清理站点数据会连同书本一起抹掉。这里没有服务器，也没有账号，合上它就是合上。"
      ].join("\n\n")
    }
  ];

  var sampleText = {};
  SAMPLES.forEach(function (b) { sampleText[b.id] = b.text; });

  /* ---------------------------------------------------------------- 存储 */

  var db = null;
  var dbFailed = false;
  var memText = new Map();

  function openDB() {
    return new Promise(function (resolve) {
      if (!window.indexedDB) { dbFailed = true; return resolve(null); }
      var req;
      try {
        req = indexedDB.open(DB_NAME, DB_VER);
      } catch (e) {
        dbFailed = true;
        return resolve(null);
      }
      var settled = false;
      var done = function (v) { if (!settled) { settled = true; resolve(v); } };
      req.onupgradeneeded = function () {
        var d = req.result;
        if (!d.objectStoreNames.contains("texts")) d.createObjectStore("texts");
      };
      req.onsuccess = function () { db = req.result; done(db); };
      req.onerror = function () { dbFailed = true; done(null); };
      req.onblocked = function () { done(null); };
      setTimeout(function () { done(null); }, 1500);
    });
  }

  function putText(id, text) {
    memText.set(id, text);
    if (!db) return Promise.resolve();
    return new Promise(function (resolve) {
      try {
        var tx = db.transaction("texts", "readwrite");
        tx.objectStore("texts").put(text, id);
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { resolve(); };
      } catch (e) { resolve(); }
    });
  }

  function readText(id) {
    if (sampleText[id]) return Promise.resolve(sampleText[id]);
    if (memText.has(id)) return Promise.resolve(memText.get(id));
    if (!db) return Promise.resolve("");
    return new Promise(function (resolve) {
      try {
        var tx = db.transaction("texts", "readonly");
        var rq = tx.objectStore("texts").get(id);
        rq.onsuccess = function () {
          var v = rq.result || "";
          memText.set(id, v);
          resolve(v);
        };
        rq.onerror = function () { resolve(""); };
      } catch (e) { resolve(""); }
    });
  }

  var DEFAULTS = {
    fontSize: 38,
    lineHeight: 1.68,
    margin: 84,
    fontFamily: "serif",
    align: "justify",
    indent: true,
    theme: "paper",
    brightness: 1.0,
    warmth: 0.12,
    flash: true,
    showFooter: true,
    sort: "recent",
    view: "grid",
    stats: { seconds: 0 }
  };

  function deepMerge(base, patch) {
    var out = {};
    Object.keys(base).forEach(function (k) { out[k] = base[k]; });
    if (patch && typeof patch === "object") {
      Object.keys(patch).forEach(function (k) {
        if (k === "stats" && patch.stats && typeof patch.stats === "object") {
          out.stats = Object.assign({ seconds: 0 }, patch.stats);
        } else {
          out[k] = patch[k];
        }
      });
    }
    if (!out.stats) out.stats = { seconds: 0 };
    return out;
  }

  function loadSettings() {
    var raw = null;
    try { raw = localStorage.getItem(SET_KEY); } catch (e) {}
    var parsed = null;
    if (raw) { try { parsed = JSON.parse(raw); } catch (e) {} }
    return deepMerge(DEFAULTS, parsed);
  }

  function saveSettings(s) {
    try { localStorage.setItem(SET_KEY, JSON.stringify(s)); } catch (e) {}
  }

  function loadLibrary() {
    var raw = null;
    try { raw = localStorage.getItem(LIB_KEY); } catch (e) {}
    if (!raw) return null;
    try {
      var arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return null;
      return arr;
    } catch (e) { return null; }
  }

  function saveLibrary(books) {
    try { localStorage.setItem(LIB_KEY, JSON.stringify(books)); } catch (e) {}
  }

  function seedLibrary() {
    var now = Date.now();
    return SAMPLES.map(function (s, i) {
      return {
        id: s.id,
        title: s.title,
        author: s.author,
        seed: s.seed,
        chars: s.text.length,
        addedAt: now - (SAMPLES.length - i) * 60000,
        lastReadAt: 0,
        offset: 0,
        progress: 0,
        finished: false,
        bookmarks: []
      };
    });
  }

  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function decodeBuffer(buf) {
    var bytes = new Uint8Array(buf);
    if (bytes.length > 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
      return new TextDecoder("utf-8").decode(bytes.subarray(3));
    }
    if (bytes.length > 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
      return new TextDecoder("utf-16le").decode(bytes.subarray(2));
    }
    if (bytes.length > 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
      return new TextDecoder("utf-16be").decode(bytes.subarray(2));
    }
    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch (e) {
      try { return new TextDecoder("gb18030").decode(bytes); } catch (e2) {}
      try { return new TextDecoder("gbk").decode(bytes); } catch (e3) {}
      return new TextDecoder("utf-8").decode(bytes);
    }
  }

  function parseName(filename) {
    var base = filename.replace(/\.[^.]+$/, "").replace(/[_]+/g, " ").trim();
    var title = base;
    var author = "";
    var m = base.match(/《([^》]+)》\s*(.*)$/);
    if (m) {
      title = m[1].trim();
      author = m[2].replace(/^(作者|by)[:：\s]*/i, "").trim();
    } else {
      var parts = base.split(/\s+[-—–]\s+|\s+by\s+/i);
      if (parts.length >= 2 && parts[0] && parts[1]) {
        title = parts[0].trim();
        author = parts.slice(1).join(" ").trim();
      }
    }
    title = title.replace(/^[-_\s]+|[-_\s]+$/g, "") || "未命名书籍";
    if (title.length > 60) title = title.slice(0, 60);
    return { title: title, author: author || "未知作者" };
  }

  function sanitize(text) {
    return String(text)
      .replace(/\r\n?/g, "\n")
      .replace(/\u0000/g, "")
      .replace(/[ \t]+$/gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  var Store = {
    init: async function () {
      await openDB();
      var lib = loadLibrary();
      if (!lib) {
        lib = seedLibrary();
        saveLibrary(lib);
      }
      return lib;
    },
    readText: readText,
    saveLibrary: saveLibrary,
    saveSettings: saveSettings,
    loadSettings: loadSettings,
    decodeBuffer: decodeBuffer,
    sanitize: sanitize,
    parseName: parseName,
    hash: hash,
    samples: SAMPLES,
    get memoryOnly() { return dbFailed && !db; },
    async importFiles(fileList) {
      var out = [];
      var files = Array.prototype.slice.call(fileList || []);
      for (var i = 0; i < files.length; i++) {
        var f = files[i];
        if (!/\.(txt|md|markdown|text)$/i.test(f.name) && !/^text\//.test(f.type)) continue;
        if (f.size > 12 * 1024 * 1024) {
          out.push({ error: "文件过大：" + f.name });
          continue;
        }
        var buf = await f.arrayBuffer();
        var raw = decodeBuffer(buf);
        var text = sanitize(raw);
        if (!text) { out.push({ error: "文件是空的：" + f.name }); continue; }
        var nm = parseName(f.name);
        var head = text.slice(0, 120);
        var hm = head.match(/^\s*《([^》]{1,40})》\s*(\S{0,24})?/);
        if (hm && nm.title === f.name.replace(/\.[^.]+$/, "")) {
          nm.title = hm[1];
          if (hm[2]) nm.author = hm[2].replace(/^[·—\-\s]+/, "");
        }
        var id = "b" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        var meta = {
          id: id,
          title: nm.title,
          author: nm.author,
          seed: hash(nm.title + id) % 100000,
          chars: text.length,
          addedAt: Date.now(),
          lastReadAt: 0,
          offset: 0,
          progress: 0,
          finished: false,
          bookmarks: []
        };
        await putText(id, text);
        out.push({ book: meta });
      }
      return out;
    },
    async removeBook(id) {
      memText.delete(id);
      if (!db) return;
      try {
        var tx = db.transaction("texts", "readwrite");
        tx.objectStore("texts").delete(id);
      } catch (e) {}
    },
    async putText(id, text) { return putText(id, text); },
    seedLibrary: seedLibrary,
    clearAll: function () {
      memText.clear();
      try { localStorage.removeItem(LIB_KEY); localStorage.removeItem(SET_KEY); } catch (e) {}
      if (db) {
        try {
          var tx = db.transaction("texts", "readwrite");
          tx.objectStore("texts").clear();
        } catch (e) {}
      }
      return seedLibrary();
    }
  };

  window.Store = Store;
})();
