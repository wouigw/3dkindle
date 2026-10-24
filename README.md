# Kindle · 3D 墨水屏阅读器

**[在线使用 → wouigw.github.io/3dkindle](https://wouigw.github.io/3dkindle/)**　·　[演示视频](video/out/kindle-3d-promo.mp4)（30s，大部分画面为真实录屏）

一台跑在浏览器里的 Kindle。设备由 Three.js 实时渲染，界面则用 Canvas 2D 绘制后作为贴图贴在墨水屏上——所以它既是一个可以换角度观看的 3D 物体，也是一套真正能用的图书管理 / 阅读软件。

不是亚马逊的产品，也不连接任何服务器。

## 运行

**在线版**：打开 <https://wouigw.github.io/3dkindle/> 即可使用，无需安装；书籍与设置仍然只保存在你自己的浏览器里。

本地运行：直接双击 `index.html` 即可（无需构建、无需联网，Three.js 已放在本地）。

如果浏览器限制了 `file://` 下的存储，也可以起一个静态服务器：

```bash
python -m http.server 8000
# 打开 http://localhost:8000
```

## 它有什么

**3D 设备**
- 磨砂黑机身、倒角高光、玻璃层反光、真实比例与厚度
- 拖动空白处旋转，滚轮缩放，右上角「聚焦阅读」贴近屏幕
- 墨水屏材质：纸张色温、静态颗粒、视角暗化、整屏反转刷新
- 亮度与色温会真实地作用在屏幕上（前光灯），并照亮机身

**书库**
- 导入 `.txt` / `.md`，自动识别 UTF-8、GBK、UTF-16 编码
- 按文件名或首行 `《书名》作者` 识别书名与作者
- 网格 / 列表两种视图，按最近阅读、书名、导入时间排序
- 长按书籍：继续阅读 / 删除；底部统计已读书籍与累计阅读时长
- 内置 5 本样书（含公版古文与英文原版），可随时恢复

**阅读**
- 自动识别「第一章」「Chapter I」「一、」等章节标题并生成目录
- 轻点右侧 / 左侧翻页，轻点中间唤出工具栏；方向键同样可用
- 字号、行距、页边距、宋体 / 黑体 / 楷体、两端对齐、首行缩进
- 纸白 / 米黄 / 夜间三种主题，翻页刷新可关闭
- 书签（单本列表 + 跨书汇总）、阅读进度拖动跳转、按字符位置记忆阅读位置
- 页脚章名、页码与百分比

**数据**
- 书籍正文放在 IndexedDB，书库、进度、书签、设置放在 localStorage
- 全部数据只在本机浏览器里，不上传、无账号

## 快捷键

| 键 | 作用 |
| --- | --- |
| ← / → | 上一页 / 下一页 |
| Esc | 返回上一层（关闭面板、退出阅读） |
| M | 打开阅读工具栏 |
| 空格 | 下一页 |

## 结构

```
index.html
css/style.css
js/
  vendor/three.min.js   Three.js r158（离线）
  store.js              书籍存储、编码识别、样书
  text.js               章节识别、中英混排断行、分页
  ui-core.js            画布 UI 框架、命中区域、主题、通用控件
  ui-library.js         书架、封面、书籍操作、书签汇总
  ui-reader.js          阅读页、目录、书签、Aa 面板、进度
  ui-settings.js        设置页
  scene.js              3D 机身、墨水屏着色器、轨道相机、射线拾取
  app.js                启动与装配
```

样书均为公版文本；`The Wonderful Wizard of Oz` (1900) 与 `The Road Not Taken` (1916) 已进入公有领域。

## 演示视频

[video/out/kindle-3d-promo.mp4](video/out/kindle-3d-promo.mp4) — 30 秒，1920×1080。旋转、书库、翻页、目录、排版面板、夜间主题都是 Playwright 对真实应用的录屏，不是合成动画；片尾附项目地址。

制作工程在 [`video/`](video/)，基于 Remotion + Playwright，重新录制与渲染的命令见 [`video/README.md`](video/README.md)。
