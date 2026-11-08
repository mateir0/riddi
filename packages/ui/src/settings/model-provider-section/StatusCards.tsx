// Coding Plan 状态卡已下线：仅保留 Detail 引用的三个导出，避免商业组件复活。
// 之前这里集中编排 Coding Plan/Start Plan 状态、动作与套餐区块，依赖已删除的
// CodingPlanEntryButton、CodingPlanBillingDiscount、useCodingPlanQuotaResetUi、
// useStartPlanPreview 等商业模块；一律收口为不依赖任何商业模块的最小占位。
import type { CodingPlanStatus } from "./constants.js";

export function ModelProviderLoadingCard({ loadingLabel }: { loadingLabel: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3">
      <div className="flex items-center gap-2 text-ui-base text-foreground-subtle">
        <span>{loadingLabel}</span>
      </div>
    </div>
  );
}

export function PresetProviderPlaceholderCard({
  displayName,
  messageId,
}: {
  displayName: string;
  messageId?: string;
}) {
  return (
    <div className="bg-background/50 rounded-2xl p-3">
      <div className="text-ui-lg font-semibold text-foreground">{displayName}</div>
      {messageId ? (
        <div className="mt-1 text-ui-base text-foreground-subtle">{messageId}</div>
      ) : null}
    </div>
  );
}

export function CodingPlanStatusPanel({
  providerName,
  status,
}: {
  providerName: string;
  status: CodingPlanStatus;
} & Record<string, unknown>) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="min-w-0 space-y-1">
        <h3 className="min-w-0 truncate text-ui-lg font-semibold leading-5 text-foreground">
          {providerName}
        </h3>
        <span className="flex w-fit items-center gap-1.5 text-ui-base text-foreground-subtle">
          {status}
        </span>
      </div>
    </div>
  );
}
