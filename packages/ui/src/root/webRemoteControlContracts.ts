/**
 * 手机远控 UI 侧的通用契约（0.9.1 / 0.9.6）。
 *
 * 背景：Z.ai 账号门控的远控链路（OAuth + relay）已经整体删除，
 * `@zcode/shared` 不再导出 `WebRemoteControl*` 契约。但 UI 的移动端外壳
 * （`WebRemoteControlMobileShell` / 侧栏）本身与厂商无关，仍然复用这些
 * 纯数据结构描述 workspace / task 列表。
 *
 * 因此这里把「纯类型 + 纯函数」收敛到 UI 包内的一个叶子模块：
 * - 不再依赖任何厂商域名或远控 relay 协议；
 * - 不引入 `IPlatformService` 的远控方法（已从平台契约移除）；
 * - 远控 relay 状态、任务视图上报、设备头部等厂商相关界面已在各消费点删除。
 */
import type { WorkspacePurpose, ZCodeProvider } from "@zcode/shared";

export type WebRemoteControlStatusKind =
  | "auth-required"
  | "idle"
  | "starting"
  | "running"
  | "connecting"
  | "active"
  | "error";

export interface WebRemoteControlMobileTaskView {
  workspacePath: string;
  workspaceIdentity?: string;
  taskId: string;
}

export interface WebRemoteControlWorkspaceTarget {
  workspacePath: string;
  workspaceIdentity?: string;
  remoteSessionId?: string;
  label: string;
  workspacePurpose?: WorkspacePurpose;
  kind: "local" | "remote";
  connectionState?: "connected" | "disconnected" | "reconnecting";
  lastConnectionError?: string;
}

export interface WebRemoteControlTaskTarget {
  taskId: string;
  hostId?: string;
  title: string;
  workspacePath: string;
  workspaceIdentity?: string;
  remoteSessionId?: string;
  workspaceLabel: string;
  workspaceKind: "local" | "remote";
  createdAt: number;
  updatedAt: number;
  provider?: ZCodeProvider;
  unreadAt?: number;
}

export interface WebRemoteControlWorkspaceListResult {
  workspaces: WebRemoteControlWorkspaceTarget[];
  activeWorkspaceKey?: string;
  activeTaskId?: string;
}

export type WebRemoteControlMobileNavigationIntent = "chat";

export interface WebRemoteControlWorkspaceSwitchOptions {
  /** 仅页面导航使用，不发送给 Host；目标 Root 打开文件面板。 */
  openFileManager?: boolean;
  taskId?: string;
  taskHostId?: string;
  /** 仅解析任务目录供文件树使用，不选择任务或标记已读。 */
  fileTreeTaskId?: string;
  mobileNavigationIntent?: WebRemoteControlMobileNavigationIntent;
  /** 从项目侧栏打开未读任务时携带；目标建立后只清除这次快照对应的未读。 */
  markTaskReadExpectedUnreadAt?: number;
}

/** 工作区唯一 key：优先使用 workspaceIdentity，缺失时回退到路径。 */
export function resolveWebRemoteControlWorkspaceKey(
  target: Pick<WebRemoteControlWorkspaceTarget, "workspacePath" | "workspaceIdentity">,
): string {
  return target.workspaceIdentity?.trim() || target.workspacePath;
}

/** 远端工作区必须同时具备 identity 与 remoteSessionId 才能直接桥接。 */
export function isWebRemoteControlBridgeableWorkspaceTarget(
  workspace: WebRemoteControlWorkspaceTarget,
): boolean {
  return (
    workspace.kind !== "remote" || Boolean(workspace.workspaceIdentity && workspace.remoteSessionId)
  );
}
