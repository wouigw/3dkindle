# Kindle 3D — promo video

**项目地址：https://github.com/wouigw/3dkindle**

Remotion 项目，为仓库根目录的浏览器端 3D 墨水屏阅读器生成约 30s 演示片，片尾打在 GitHub 地址上。
所有设备画面都是 Playwright 对真实项目的录屏，不是合成动画。

## 结构

```
src/
  Root.tsx              # composition Kindle3DPromo · 1920x1080 · 30fps · 920 帧
  Composition.tsx       # 5 幕 + 15 帧淡入淡出 + BGM
  scenes/Scene1Intro    # 标题
  scenes/Scene2Device   # 旋转 / 材质 / 前光灯（rotate.mp4）
  scenes/Scene3Interface# 阅读 / 翻页 / 目录 / 排版（reading.mp4，两段交叉淡化）
  scenes/Scene4Numbers  # 0 服务器 · 5 样书 · 3 主题 · 3580 行
  scenes/Scene5Cta      # 启动方式 + 设备卡片
  cover/Cover.tsx       # B 站封面（16:9 / 4:3 / 9:16 三种排版）
capture/capture.mjs     # Playwright 录屏脚本
capture/cover-shot.mjs  # 2x 拍摄封面用的设备底图
public/footage/         # 录制产物（rotate.mp4 / reading.mp4 / library-screen.png）
```

## 重新录制真实画面

先启动项目静态服务（仓库根目录），再：

```bash
cd video
node capture/capture.mjs rotate    # 主页自动旋转
node capture/capture.mjs reading   # 加载 → 书库 → 开书 → 翻页 → 目录 → 排版 → 夜间
```

脚本用 `--enable-unsafe-swiftshader --use-angle=swiftshader` 跑 headless Chromium 的 WebGL，
通过把纹理 UV 投影到 3D 屏幕网格上计算点击坐标（`mesh.localToWorld` + `project`），
所以点得到真实按钮而不是写死像素。录完的 webm 用 ffmpeg 转 30fps H.264 放进 `public/footage/`。

## 渲染

```bash
npx remotion studio src/index.ts          # 预览
npx remotion render src/index.ts Kindle3DPromo out/kindle-3d-promo.mp4
npx remotion still  src/index.ts Kindle3DPromo out/s1.png --frame=60   # 单帧检查
```

成片：1920×1080 / 30fps / 920 帧（30.7s）/ H.264 + AAC。

## 封面

三个比例共用一份排版组件，底部是 2 倍分辨率拍下的真实设备：

```bash
npx remotion still src/index.ts CoverWide     out/cover-16x9.png --frame=0 --scale=2
npx remotion still src/index.ts CoverSquare   out/cover-4x3.png  --frame=0 --scale=2
npx remotion still src/index.ts CoverVertical out/cover-9x16.png --frame=0 --scale=2
```

出图 3840×2160 / 2880×2160 / 2160×3840；上传 B 站前转成 `-q:v 2 -pix_fmt yuvj444p` 的 JPG，
体积 0.4–0.6MB，避开 5MB 上限。
