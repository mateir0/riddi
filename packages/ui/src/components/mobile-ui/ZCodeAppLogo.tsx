import type { ZCodeAppLogoProps } from "@/components/mobile-ui/contract.js";
import { cn } from "@/components/lib/utils.js";
// 修复原因：移动端入口的品牌图标原为 Z 字形渐变方块（logo-zai.svg），
// 现改用安装包同源的 Riddi 应用图标（packages/desktop/build/icon.png 的 UI 副本），
// 保持深浅主题同一张图，避免桌面端与手机端品牌不一致。
import riddiAppIconUrl from "@/assets/riddi-app-icon.png";

/**
 * 桌面端标题栏左上角同款应用 logo（Riddi 应用图标，自带底色，深浅主题通用）。
 * 装饰性图片：调用方负责在旁边给出可读的品牌文字，避免屏幕阅读器重复朗读。
 */
export function ZCodeAppLogo({ className }: ZCodeAppLogoProps) {
  return (
    <img
      src={riddiAppIconUrl}
      alt=""
      aria-hidden="true"
      draggable={false}
      // 稳定的测试/E2E 钩子：打包器可能把 SVG 内联为 data URL，不能靠文件名断言。
      data-app-logo="zcode"
      className={cn("shrink-0 select-none object-contain", className)}
    />
  );
}
