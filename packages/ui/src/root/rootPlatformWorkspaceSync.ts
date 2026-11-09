/**
 * 0.9.1：远控 relay 已整体删除。
 *
 * 原 `rootPlatformWorkspaceSync` 负责把窗口内的 workspace / 远端会话快照推送给
 * desktop relay（`platform.syncWebRemoteControlWorkspaces`）。relay 属于 Z.ai 账号
 * 门控的远控链路，随之删除；这里只保留与 relay 无关的通用判定函数。
 */
export function shouldPublishCompleteWorkspaceSnapshot(
  hasCompletedFullTabRestore: boolean,
): boolean {
  return hasCompletedFullTabRestore;
}
