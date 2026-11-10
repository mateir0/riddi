import type { ReactNode } from "react";
import { cn } from "@/components/lib/utils.js";
// 修复原因：启动/标题栏品牌标记改用安装包同源的 Riddi 应用图标
// （packages/desktop/build/icon.png 的 UI 副本），替换原 Z 字形线稿。
// 保留原 SVG 外框与 viewBox，仅替换内部图形，`[data-desktop-logo-badge] svg`
// 结构与 w-3.25 / w-14 调用方尺寸保持不变。
import riddiAppIconUrl from "@/assets/riddi-app-icon.png";

interface RootStartupLoadingProps {
  label: string;
  children?: ReactNode;
  busy?: boolean;
}

export function RootStartupLoading({ label, children, busy = true }: RootStartupLoadingProps) {
  return (
    <div
      // Web 端全局 html/body/#root 为 Electron 透明背景让路，React 接管后会替换 HTML 启动壳。
      // 这里必须由阻塞态自身承接主题背景，否则远控链接会在 Root 恢复期间继续露出浏览器白底。
      className="flex h-full min-h-dvh flex-col items-center justify-center gap-6 bg-background text-foreground"
      role="status"
      aria-busy={busy}
      aria-label={label}
      data-testid="root-startup-loading"
    >
      <ZCodeStartupLogoBadge />
      {children}
    </div>
  );
}

/** 初始化与引导共用品牌图标，保持底色、描边、圆角和标志比例一致。 */
export function ZCodeStartupLogoBadge({
  animated = true,
  size = "default",
}: {
  animated?: boolean;
  size?: "default" | "titlebar";
}) {
  return (
    <div
      data-desktop-logo-badge={size === "titlebar" ? "true" : undefined}
      className={cn(
        "relative flex items-center justify-center bg-[linear-gradient(180deg,#000000_0%,#151718_100%)] text-[#ffffff] before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-[rgba(255,255,255,0.1)] before:content-['']",
        size === "titlebar"
          ? "size-5 rounded shadow-sm/20 before:border-white/20"
          : "size-24 rounded-3xl shadow-xl/20",
      )}
    >
      {/* Button 会给 SVG 默认尺寸；紧凑 Logo 显式恢复自动高度，保持标志原始比例。 */}
      <ZCodeStartupLogo
        className={size === "titlebar" ? "size-auto w-3.25" : "h-auto w-14"}
        animated={animated}
      />
    </div>
  );
}

export function ZCodeStartupLogo({
  className,
  animated = true,
}: {
  className?: string;
  animated?: boolean;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="118"
      height="100"
      fill="none"
      viewBox="0 0 256 218"
      className={cn("shrink-0 text-current", className)}
      aria-hidden="true"
      focusable="false"
    >
      {animated ? (
        <animate
          attributeName="opacity"
          begin="3s"
          dur="1.8s"
          repeatCount="indefinite"
          values="1;0.4;1"
        />
      ) : null}
      {/* 图标是正方形位图，用 meet 在原有 256x218 画框内居中留边，避免裁掉标记本体。 */}
      <image
        href={riddiAppIconUrl}
        x="0"
        y="0"
        width="256"
        height="218"
        preserveAspectRatio="xMidYMid meet"
      />
    </svg>
  );
}
