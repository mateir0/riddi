# New Task Empty State Logo

## 背景

New Task 的空状态标题是用户进入项目后开始创建任务的首屏提示，需要在不影响文本可读性和布局稳定性的前提下增加 Riddi 品牌标识。

## 方案

- 在 `ConversationDraftEmptyState` 文本背后加入装饰性 Riddi 应用图标位图（`packages/ui/src/assets/riddi-app-icon.png`）。
- 该资源与 `packages/desktop/build/icon.png` 同源，是安装包/任务栏所用的同一张应用图标，保证桌面端、手机远控与安装包品牌一致。
- Logo 容器为 `aspect-square` 并以 `min(72vw, 25rem)` 自适应收缩，避免横向溢出；正方形画框同时避免把位图横向拉伸。
- Logo 叠加 `opacity-70`，比正文 `foreground` 降低层级；深浅主题共用同一张图，不再按主题拆两套图形，也不需要底部渐隐遮罩。
- Logo 相对标题中心上移 `-mt-10`，让装饰图形主要停留在标题背后和上方，减少对输入区的视觉干扰。
- Logo 使用 `aria-hidden` 和 `pointer-events-none`，不参与可读性朗读，也不拦截输入。
- 文本使用更高层级覆盖在 logo 上方，保持现有国际化文案和布局不变。
