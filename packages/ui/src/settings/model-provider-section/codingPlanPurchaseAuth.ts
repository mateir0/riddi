import {
  BUILTIN_MODEL_PROVIDER_IDS,
  isCodingPlanModelProviderId,
  isZaiCodingPlanProviderId,
} from "@zcode/shared";
import { type CodingPlanProviderId } from "@/settings/model-provider-section/constants.js";

export type CodingPlanPurchaseAuthStatus =
  | "unknown"
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "error";

export function isCodingPlanPurchaseAuthPending(status: CodingPlanPurchaseAuthStatus): boolean {
  return status === "unknown" || status === "loading";
}

export async function readCodingPlanPurchaseTokenState(credentialService: {
  load(key: string): Promise<string | null>;
}) {
  const [activeProvider, zaiToken, bigmodelToken] = await Promise.all([
    credentialService.load("oauth:active_provider"),
    credentialService.load(`oauth:${"zai"}:access_token`),
    credentialService.load(`oauth:${"bigmodel"}:access_token`),
  ]);
  const active =
    activeProvider === "zai" || activeProvider === "bigmodel"
      ? activeProvider
      : null;
  return {
    [BUILTIN_MODEL_PROVIDER_IDS.zaiIndividualCodingPlan]:
      active === "zai" && Boolean(zaiToken?.trim()),
    [BUILTIN_MODEL_PROVIDER_IDS.zaiStartPlan]:
      active === "zai" && Boolean(zaiToken?.trim()),
    [BUILTIN_MODEL_PROVIDER_IDS.bigmodelIndividualCodingPlan]:
      active === "bigmodel" && Boolean(bigmodelToken?.trim()),
    [BUILTIN_MODEL_PROVIDER_IDS.bigmodelStartPlan]:
      active === "bigmodel" && Boolean(bigmodelToken?.trim()),
  } satisfies Partial<Record<CodingPlanProviderId, boolean>>;
}

export function normalizeCodingPlanProviderId(
  providerId: string | null | undefined,
): CodingPlanProviderId | null {
  const normalized = providerId?.trim();
  return normalized && isCodingPlanModelProviderId(normalized)
    ? (normalized as CodingPlanProviderId)
    : null;
}

export function isCodingPlanProviderId(
  providerId: CodingPlanProviderId | null,
): providerId is CodingPlanProviderId {
  return Boolean(providerId);
}

export function resolveCodingPlanstring(
  providerId: CodingPlanProviderId,
): string {
  return isZaiCodingPlanProviderId(providerId) ? "zai" : "bigmodel";
}
