import {
  BUILTIN_PROVIDER_TEMPLATE_IDS,
  type AppSettings,
  type Locale,
  type ProviderFamilyDomain,
} from "@zcode/shared";
import type { ModelSelectionView } from "@zcode/services";
import { encodeCustomModelValue } from "@/lib/zcodeCustomModelValue.js";

export type ApiKeyProviderChoice = "nvidia" | "zai" | "bigmodel";

// 内置模板 ID 在 shared 的 BUILTIN_PROVIDER_TEMPLATE_IDS 只登记了 zai/bigmodel；
// NIM 模板由 config/provider/zcode-builtin.json 的 templateRules 定义，这里直接用其 templateId。
export const NVIDIA_NIM_TEMPLATE_ID = "nvidia-nim";

export function resolveLoginApiKeyDefaultProvider(locale: Locale): ApiKeyProviderChoice {
  // Riddi 默认 provider 为 NVIDIA NIM，所有 locale 一致，不再按语言分流到 Z.ai/BigModel。
  void locale;
  return "nvidia";
}

export function resolveLoginApiKeyTemplateId(
  choice: ApiKeyProviderChoice,
): "nvidia-nim" | "zai-api" | "bigmodel-api" {
  if (choice === "nvidia") {
    return NVIDIA_NIM_TEMPLATE_ID;
  }
  return choice === "zai"
    ? BUILTIN_PROVIDER_TEMPLATE_IDS.zai
    : BUILTIN_PROVIDER_TEMPLATE_IDS.bigmodel;
}

export function resolveLoginApiKeyProviderLabel(choice: ApiKeyProviderChoice): string {
  // Welcome Screen API Key 错误提示需要使用 BigModel 品牌固定写法。
  if (choice === "nvidia") {
    return "NVIDIA NIM";
  }
  return choice === "zai" ? "Z.ai" : "BigModel";
}

export function resolveLoginApiKeyProviderFamilyDomain(
  choice: ApiKeyProviderChoice,
): ProviderFamilyDomain | null {
  // NIM 不属于 Z.ai/BigModel 的 provider family，无法映射到 ProviderFamilyDomain。
  return choice === "nvidia" ? null : choice;
}

export function buildLoginApiKeySkipSettings(
  choice: ApiKeyProviderChoice,
  now: number,
): Pick<
  AppSettings,
  "providerFamilyDomain" | "providerFamilyDomainUpdatedAt" | "providerFamilyDomainMigrated"
> {
  return {
    // NIM 无对应 family domain；沿用 providerFamilyDomainSettings 的清空约定写入 ""，
    // 使 skip 不会把用户误绑到 Z.ai/BigModel family。
    providerFamilyDomain: (resolveLoginApiKeyProviderFamilyDomain(choice) ??
      "") as AppSettings["providerFamilyDomain"],
    providerFamilyDomainUpdatedAt: now,
    providerFamilyDomainMigrated: true,
  };
}

export function shouldShowLoginApiKeyLink(
  apiKeyValue: string,
  apiKeyUrl: string | undefined,
): boolean {
  return Boolean(apiKeyUrl) && apiKeyValue.trim().length === 0;
}

export function buildLoginApiKeyDefaultModelPreferenceFromSelection(
  view: ModelSelectionView,
  providerId: string,
): string | null {
  const firstModel = view.providers.find((provider) => provider.providerId === providerId)
    ?.models[0]?.modelId;
  return firstModel ? encodeCustomModelValue(providerId, firstModel) : null;
}

export function resolveHydratedLoginApiKeyValue({
  savedApiKey,
  userEdited,
}: {
  savedApiKey: string;
  userEdited: boolean;
}): string | null {
  if (userEdited) {
    return null;
  }
  return savedApiKey.trim();
}
