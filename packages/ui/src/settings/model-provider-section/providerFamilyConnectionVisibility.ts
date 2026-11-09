/**
 * 0.9.2：账号 / 套餐（account + Coding Plan）可见性与权益状态解析已随账号链路整体删除。
 *
 * 原 `providerFamilyConnectionVisibility` 负责把 Z.ai / BigModel 的账号权益快照映射成
 * 设置页导航里的「个人版 / 团队版」连接项。这里保留同名本地实现，但不再有任何厂商
 * 账号域、套餐商品或权益查询：编码计划条目永远为空，权益状态永远返回「未开通」。
 */
import type {
  CodingPlanEntitlementState,
  ModelProviderNavGroup,
} from "@/settings/model-provider-section/constants.js";
import type { EnterpriseCodingPlanProductDisplay } from "@/settings/model-provider-section/enterpriseCodingPlanProducts.js";
import type {
  ProviderFamilyConnectionSelection,
  ProviderFamilyConnectionSelectionSettings,
} from "@zcode/shared";

export function resolveCodingPlanEntitlementState({
  entitlement,
}: {
  providerId: string;
  accountEntitled: boolean;
  accountAvailability?: string;
  accountUnavailableReason?: string | null;
  entitlement?: CodingPlanEntitlementState;
  modelProvidersLoading?: boolean;
}): {
  status: "disconnected";
  statusLabelId?: string;
  planLevel: null;
  currentProductId: null;
  subscriptionBillingCycle: null;
  subscriptionRenewTime: null;
  subscriptionExpireTime: null;
  subscriptionDetails: [];
  quotaLimits: [];
  mcpQuotaLimit: null;
} {
  // 0.9.2：账号权益查询已下线，套餐状态恒为「未连接」。
  void entitlement;
  return {
    status: "disconnected",
    planLevel: null,
    currentProductId: null,
    subscriptionBillingCycle: null,
    subscriptionRenewTime: null,
    subscriptionExpireTime: null,
    subscriptionDetails: [],
    quotaLimits: [],
    mcpQuotaLimit: null,
  };
}

export function buildVisibleFamilyConnectionItems({
  items,
  codingPlanEntitlements,
  subscribedTeamProducts,
  showPurchasedTeamPlanFallback,
  connectionSelections,
  teamPlanSelections,
}: {
  items: ModelProviderNavGroup["items"];
  codingPlanEntitlements?: Partial<Record<string, CodingPlanEntitlementState>>;
  subscribedTeamProducts?: EnterpriseCodingPlanProductDisplay[];
  showPurchasedTeamPlanFallback?: boolean;
  connectionSelections?: ProviderFamilyConnectionSelectionSettings;
  teamPlanSelections?: Record<string, ProviderFamilyConnectionSelection>;
}): ModelProviderNavGroup["items"] {
  // 0.9.2：没有账号 / 套餐连接项可言，原样返回调用方传入的条目。
  void codingPlanEntitlements;
  void subscribedTeamProducts;
  void showPurchasedTeamPlanFallback;
  void connectionSelections;
  void teamPlanSelections;
  return items;
}
