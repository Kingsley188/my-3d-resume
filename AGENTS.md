# 模板维护约定

默认中文，保留现有框架、3D 镜头、动画与样式。

普通用户换人只需修改 `site/profile.json`、`site/models/me.glb` 和 `site/works/`，不需要 Node 或重新构建。资料在启动时通过 fetch 读取，不可硬编码个人内容到源码。开发示例数据放 `public/profile.json`。

固定五个履历节点，对应 sticker0/1/5/4/6，额头 sticker7。相机、动画、focus-* 和 sticker0..14 不得随意重命名。

改代码后运行 `npm run typecheck`、`npx vite build`，将 dist 完整同步到 site。同步前备份用户已修改的 site 资料，避免示例覆盖真实资料。仓库保留 site 和 rig，排除 node_modules、dist、.env*、日志和密钥。

验收需检查静态服务、运行时资料替换、首屏和节点镜头；报告区分本地保存与发布。保留 LICENSE、NOTICE 及致谢。不自行推送或部署。
