import type { AppSettings, Locale, ProviderFamilyDomain } from "@zcode/shared";
import type { ModelSelectionView } from "@zcode/services";
import { encodeCustomModelValue } from "@/lib/zcodeCustomModelValue.js";

// Riddi 的 API Key 登录只提供 NVIDIA NIM（zai-api / bigmodel-api 模板已从内置目录移除）。
export type ApiKeyProviderChoice = "nvidia";

// NIM 模板由 config/provider/zcode-builtin.json 的 templateRules 定义，这里直接用其 templateId。
export const NVIDIA_NIM_TEMPLATE_ID = "nvidia-nim";

export function resolveLoginApiKeyDefaultProvider(locale: Locale): ApiKeyProviderChoice {
  void locale;
  return "nvidia";
}

export function resolveLoginApiKeyTemplateId(choice: ApiKeyProviderChoice): "nvidia-nim" {
  void choice;
  return NVIDIA_NIM_TEMPLATE_ID;
}

export function resolveLoginApiKeyProviderLabel(choice: ApiKeyProviderChoice): string {
  void choice;
  return "NVIDIA NIM";
}

export function resolveLoginApiKeyProviderFamilyDomain(
  choice: ApiKeyProviderChoice,
): ProviderFamilyDomain | null {
  void choice;
  // NIM 不属于 Z.ai/BigModel 的 provider family，无法映射到 ProviderFamilyDomain。
  return null;
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
