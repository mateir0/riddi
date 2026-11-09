// Z.ai / BigModel 的 Provider 与账号身份已整体删除；旧模型 ID 不再做官方站点归一化，
// 只保留原值，避免为已不存在的 Provider 重新引入可构造路径。
export function migrateLegacyOfficialGlmModelId(_providerId: string, modelId: string): string {
  return modelId;
}

/**
 * 仅供已发布旧数据的单向升级使用，不是运行时 Provider 别名或选择兜底。
 * 依赖当前账号解释旧 Coding Plan 会使离线/SSH 迁移丢失原意图。
 * 同域 Individual 仅是确定性迁移落点，当前账号对应留给有效选择解析，不能据此绑定执行。
 * 迁移不查模型/档位是否可用；普通未知 ID 不构成旧格式证据。
 */
export function migrateLegacyModelProviderId(providerId: string): string | undefined {
  // 旧 Z.ai / BigModel 模板与账号 Provider 已从产品中删除，对应记录保持不可解析；
  // 不再提供迁移落点，避免这些身份经由旧数据重新进入配置。
  return providerId.startsWith("builtin:") ? undefined : providerId;
}
