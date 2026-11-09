/**
 * Provider family domain —— 仅保留「已持久化设置字段」所需的类型兼容。
 *
 * 背景（0.9.2）：Z.ai / BigModel 账号链路（OAuth backend、account provider、
 * entitlement 分支、套餐 family spec）已整体删除。family spec 原本携带
 * `rootDomain` / `teamCodingPlanManageUrl` / `oauthProviderId` 等厂商域名与
 * 账号入口，现在没有任何运行时消费者；继续保留只会让运行时再次指向被移除的
 * 厂商后端。
 *
 * 这里只保留 `ProviderFamilyDomain` 这个**类型**，用于读取历史 settings 文件里
 * 已存在的 `providerFamilyDomain` 字段（不做数据迁移、不做行为解释），
 * 避免旧配置文件因 schema 变化而无法读取。
 */
export type ProviderFamilyDomain = "zai" | "bigmodel";

/** 归一化历史设置字段；未知值一律丢弃（不迁移、不参与任何运行判断）。 */
export function normalizeProviderFamilyDomain(
  value: string | null | undefined,
): ProviderFamilyDomain | null {
  return value === "zai" || value === "bigmodel" ? value : null;
}
