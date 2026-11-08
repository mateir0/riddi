import { useEffect, useMemo, useRef } from "react";
import type { IZCodeAgentService } from "@zcode/services";
import type { DynamicWorkflowMode } from "@zcode/shared";
import { logger } from "@/logger.js";
import {
  useDynamicWorkflowAvailabilityStore,
  type DynamicWorkflowAvailabilitySnapshot,
} from "@/store/dynamicWorkflowAvailabilityStore.js";

/** 读动态工作流可用性快照（本地解析，只读）。 */
export function useDynamicWorkflowAvailability(): DynamicWorkflowAvailabilitySnapshot {
  const status = useDynamicWorkflowAvailabilityStore((state) => state.status);
  const enabled = useDynamicWorkflowAvailabilityStore((state) => state.enabled);
  const config = useDynamicWorkflowAvailabilityStore((state) => state.config);
  return useMemo(() => ({ status, enabled, config }), [config, enabled, status]);
}

/** app 会话级本地解析，挂在 Root 里一次：默认 offer disabled，用户模式来自设置。 */
export function useDynamicWorkflowAvailabilityLoader(
  userMode?: DynamicWorkflowMode,
): void {
  const ensureLoaded = useDynamicWorkflowAvailabilityStore((state) => state.ensureLoaded);
  useEffect(() => {
    void ensureLoaded(userMode);
  }, [ensureLoaded, userMode]);
}

/**
 * 用户选择变化后的同步：通知本窗口 Host 重发 CLI 策略，再本地重读生效值。
 * 首次读到的值只是基线；多次变化串行处理。
 */
export function useDynamicWorkflowUserModeSync(params: {
  settingsLoaded: boolean;
  userMode: DynamicWorkflowMode | undefined;
  zcodeAgentService: Pick<IZCodeAgentService, "syncDynamicWorkflowUserMode">;
}): void {
  const { settingsLoaded, userMode, zcodeAgentService } = params;
  const reload = useDynamicWorkflowAvailabilityStore((state) => state.reload);
  const observedRef = useRef<{ userMode: DynamicWorkflowMode | undefined } | null>(null);
  const chainRef = useRef<Promise<void>>(Promise.resolve());
  useEffect(() => {
    if (!settingsLoaded) return;
    const observed = observedRef.current;
    observedRef.current = { userMode };
    if (observed === null || observed.userMode === userMode) return;
    chainRef.current = chainRef.current.then(async () => {
      try {
        await zcodeAgentService.syncDynamicWorkflowUserMode(userMode ? { mode: userMode } : {});
      } catch (error) {
        logger.warn("[dynamic-workflow] 用户选择同步到 Host 失败", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
      await reload(userMode);
    });
  }, [reload, settingsLoaded, userMode, zcodeAgentService]);
}
