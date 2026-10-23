# my-3d-resume

用一张照片和个人资料制作带 3D 镜头、五段履历、贴纸弹窗与作品集的个人网站。

在线示例：https://about-jeff.bigapple.work

**推荐通过 BigApple 的 my-3d-resume 技能使用。** 支持 Mac 和 Windows；普通使用者不需要安装 Node.js。

## 不装 Node 也能换成自己

仓库的 `site/` 是已经构建好的完整静态网站。只需替换：

- `site/profile.json`：个人介绍、五段履历、贴纸弹窗、作品与联系链接。
- `site/models/me.glb`：带固定镜头、动画和贴纸的个人模型。
- `site/works/`：作品图片；资料中填 `works/图片名.jpg`。

通过静态 HTTP 服务打开整个 `site/`，不要双击 HTML。安装了 Python 时，Mac 可执行 `python3 -m http.server 5188 --bind 127.0.0.1 --directory site`，Windows 可执行 `py -3 -m http.server 5188 --bind 127.0.0.1 --directory site`，然后访问 http://127.0.0.1:5188 。本地预览不代表发布。

`profile.json` 在网页启动时读取，换文字、模型和图片无需 npm 或重建。`public/profile.json` 是开发示例；开发模式读取 public，预构建版本读取 site。代码重建前请先备份使用者已修改的 site 资料，避免被开发示例覆盖。

## 资料约定

以 `public/profile.json` 为完整示例。`name`、`role`、`meta`、`intro`、`corner`、`nodes`、`forehead`、`extraStickers`、`works`、`links` 都在运行时读取。`en` 是可选的同结构英文覆盖，省略便隐藏语言切换；英文对象未填写的字段沿用主语言，对数组按位置覆盖，数组长度按英文覆盖值处理。

固定五个节点依次对应 `sticker0 / sticker1 / sticker5 / sticker4 / sticker6`，额头为 `sticker7`；其余九个示例贴纸保留。不可重命名模型里的 sticker、focus 节点或改掉镜头动画。字段缺失或类型错误时使用空值，额外字段忽略；节点不足补空、超出截断，控制台输出警告。图片缺省或加载失败保留渐变占位。

作品格式：`{ id, title, tagline, footer, items: [{ name, meta, image, link }] }`。`links` 为 `[{ label, url }]`。示例履历原有要点保存在 `tags`，补充任职信息保存在 `desc` 的多行文本中。

## 开发者

需要 Node.js 与 npm，沿用 React、TypeScript、Vite 和 Three.js 工程。

```bash
npm ci
npm run dev -- --host 127.0.0.1
npm run typecheck
npx vite build
```

代码修改后必须将 `dist/` 完整同步到 `site/`，包括 profile、models、textures 和 fonts。跨平台同步命令（在模板目录执行）：

```bash
python3 -c "import shutil; shutil.copytree('dist', 'site', dirs_exist_ok=True)"
```

Windows 将 `python3` 换为 `py -3`。发布或交付前核对 site 没有过期文件；仓库需保留 site，忽略 dist 和 node_modules。

`rig/rig.glb` 从示例模型移除 `man` 人物网格，保留空变换节点、相机、动画、focus 锚点、15 个 sticker 和原二进制资源，供技能组装模型。开发者可运行 `python3 scripts/build_rig.py` 重新生成，不依赖 Blender。

## 致谢与许可

基于 Sen Zheng 的 [sen-3d-resume](https://github.com/dayinji/sen-3d-resume)，代码采用 MIT 许可，完整保留上游 LICENSE。原始工程包未附 LICENSE，本模板从上游仓库补回原文。

9 张示例贴纸经原作者 Sen 授权在本模板中使用。示例人物 Jeff 的模型和资料仅作演示，使用者须替换成自己的。详见 NOTICE。
