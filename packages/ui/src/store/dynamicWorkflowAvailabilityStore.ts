import { create } from "zustand";
import {
  applyDynamicWorkflowUserMode,
  createDynamicWorkflowClientConfig,
  type DynamicWorkflowClientConfig,
  type DynamicWorkflowMode,
} from "@zcode/shared";

// 动态工作流可用性在 renderer 本地解析：默认 offer 为 disabled（fail-closed），
// 用户在设置中的选择经 applyDynamicWorkflowUserMode 覆盖为生效模式。
// 不再向已删除的订阅服务请求远端灰度快照。

export type DynamicWorkflowAvailabilityStatus = "loading" | "ready";

export interface DynamicWorkflowAvailabilitySnapshot {
  readonly status: DynamicWorkflowAvailabilityStatus;
  readonly enabled: boolean;
  readonly config: DynamicWorkflowClientConfig | null;
}

interface DynamicWorkflowAvailabilityState extends DynamicWorkflowAvailabilitySnapshot {
  ensureLoaded(userMode?: DynamicWorkflowMode): Promise<void>;
  refresh(userMode?: DynamicWorkflowMode): Promise<void>;
  reload(userMode?: DynamicWorkflowMode): Promise<void>;
}

const INITIAL_SNAPSHOT: DynamicWorkflowAvailabilitySnapshot = {
  status: "loading",
  enabled: false,
  config: null,
};

function resolveLocalSnapshot(
  userMode?: DynamicWorkflowMode,
): DynamicWorkflowAvailabilitySnapshot {
  const config = applyDynamicWorkflowUserMode(
    createDynamicWorkflowClientConfig("disabled", "default"),
    userMode,
  );
  return { status: "ready", enabled: config.enabled === true, config };
}

export const useDynamicWorkflowAvailabilityStore = create<DynamicWorkflowAvailabilityState>(
  (set) => ({
    ...INITIAL_SNAPSHOT,

    async ensureLoaded(userMode?: DynamicWorkflowMode): Promise<void> {
      set(resolveLocalSnapshot(userMode));
    },

    async refresh(userMode?: DynamicWorkflowMode): Promise<void> {
      set(resolveLocalSnapshot(userMode));
    },

    async reload(userMode?: DynamicWorkflowMode): Promise<void> {
      set(resolveLocalSnapshot(userMode));
    },
  }),
);

/** 测试用：清掉快照。 */
export function resetDynamicWorkflowAvailabilityStoreForTests(): void {
  useDynamicWorkflowAvailabilityStore.setState({ ...INITIAL_SNAPSHOT });
}
