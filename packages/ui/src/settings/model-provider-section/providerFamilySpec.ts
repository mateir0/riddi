/**
 * 0.9.2：供应商 family spec（Z.ai / BigModel 账号族）已随账号链路整体删除。
 *
 * 这里保留一个**本地**的形状定义和三个「永远返回 null」的解析函数，让设置页仍按同一套
 * 分支形状编译，但不再有任何厂商域名、购买链接或账号域判断：
 * - `resolveModelProviderFamilySpecByProviderId`：没有 family spec → 返回 null；
 * - `resolveModelProviderFamilyIdByProviderId`：没有 family id → 返回 null；
 * - `resolveProviderFamilyDomainFromOAuthProvider`：没有账号域 → 返回 null。
 *
 * 调用方遇到 null 时一律走「无账号 / 无套餐」的普通 API Key 分支。
 */
import type { BuiltinModelProviderId, ProviderFamilyDomain } from "@zcode/shared";

export interface ProviderFamilySpecShape {
  id: ProviderFamilyDomain;
  label: string;
  oauthProviderId: string;
  startPlanProviderId: BuiltinModelProviderId;
  individualCodingPlanProviderId: BuiltinModelProviderId;
  teamCodingPlanProviderId: BuiltinModelProviderId;
}

export function resolveModelProviderFamilySpecByProviderId(
  _providerId: string,
): ProviderFamilySpecShape | null {
  return null;
}

export function resolveModelProviderFamilyIdByProviderId(_providerId: string): null {
  return null;
}

export function resolveProviderFamilyDomainFromOAuthProvider(
  _oauthProviderId: string | null | undefined,
): ProviderFamilyDomain | null {
  return null;
}
