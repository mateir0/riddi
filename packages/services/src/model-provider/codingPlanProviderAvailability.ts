/* eslint-disable max-lines -- Coding Plan 登录、订阅与 Start/Coding 互斥校验需要集中维护，拆散会让系统禁用原因更难追踪。 */
import {
  ApiError,
  BIGMODEL_PROVIDER_ID,
  buildBigModelApiUrl,
  buildRuntimeZaiBusinessUrl,
  resolveBigModelApiOrigin,
  ZAI_PROVIDER_ID,
  type ApiClient,
  type ProviderFamilyDomain,
  type ProviderFamilyConnectionSelectionSettings,
} from "@zcode/shared";
import { type BigModelTeamPlanBizContext } from "#src/bigmodel/teamPlanApiKey.js";
import {
  fetchPersonalCodingPlanEntitlement,
  fetchTeamCodingPlanEntitlement,
} from "#src/bigmodel/codingPlanEntitlement.js";
import { createServiceLogger } from "#src/logger/serviceLogger.js";
import { readApiJson } from "../providers/api/apiJson.js";
// 原订阅 provider 文件已随 Coding Plan 经济删除；这两个登录态 header 构造与之等价，
// 只服务仍保留到 0.9 的账号可用性校验，内联在此避免复活订阅模块。
function createBigModelLoginAuthHeaders(token: string): Record<string, string> {
  return { Authorization: token, "Content-Type": "application/json" };
}
function createZaiLoginAuthHeaders(token: string): Record<string, string> {
  return { Authorization: token, "Content-Type": "application/json" };
}

const REQUEST_TIMEOUT_MS = 15_000;
const log = createServiceLogger("coding-plan-availability");
const BIGMODEL_SUBSCRIPTION_LIST_PATH = "/api/biz/subscription/list";

const ZCODE_JWT_TOKEN_KEY = "zcodejwttoken";

export type CodingPlanUnavailableReason =
  | "coding_plan_not_authenticated"
  | "coding_plan_not_connected"
  | "coding_plan_auth_failed"
  | "coding_plan_not_entitled";

function buildZaiSubscriptionListUrl(): string {
  // ZAI 测试环境业务 token 只能请求配置的 ZAI Business origin。
  // availability 校验必须和 OAuth business login 共用同一套 ZCODE_ENV 域名分流，只允许 origin 不同。
  return buildRuntimeZaiBusinessUrl(process.env, "/api/biz/subscription/list");
}

interface CodingPlanAvailabilityCredentialService {
  load(key: string): Promise<string | null>;
}

interface CodingPlanAvailabilityContext {
  apiClient?: ApiClient;
  credentialService?: CodingPlanAvailabilityCredentialService;
  providerFamilyConnectionSelections?: ProviderFamilyConnectionSelectionSettings;
}

interface BigModelCustomerInfoEnvelope {
  code?: number;
  success?: boolean;
  msg?: string;
  data?: BigModelCustomerInfo | null;
}

interface BigModelCustomerInfo {
  organizations?: Array<{
    organizationId?: string | null;
    projects?: Array<{
      projectId?: string | null;
      projectType?: number | string | null;
    }> | null;
  }> | null;
}

export type CodingPlanAvailabilityResult =
  | { kind: "available"; models?: readonly string[] }
  | { kind: "pending"; effectiveAt: number; models: readonly string[] }
  | { kind: "unavailable"; reason: CodingPlanUnavailableReason }
  | { kind: "unknown" };

export interface CodingPlanAvailabilityProvider {
  readonly providerId: string;
  readonly family: ProviderFamilyDomain;
  readonly planKind: "start-plan" | "individual-coding-plan" | "team-coding-plan";
  readonly apiKey?: string | null;
}

export async function validateCodingPlanProviderAvailability(
  provider: CodingPlanAvailabilityProvider,
  context: CodingPlanAvailabilityContext,
): Promise<CodingPlanAvailabilityResult> {
  if (!context.apiClient) {
    return { kind: "unknown" };
  }

  if (provider.planKind === "start-plan") {
    // Start Plan 已随 Coding Plan 经济删除，不再请求 billing/balance 校验。
    return { kind: "unavailable", reason: "coding_plan_not_connected" };
  }

  if (provider.planKind !== "individual-coding-plan") {
    return { kind: "unknown" };
  }

  if (provider.family === "zai") {
    return validateSubscriptionListAvailability(provider, context, buildZaiSubscriptionListUrl());
  }

  return validateSubscriptionListAvailability(
    provider,
    context,
    buildBigModelApiUrl(process.env, BIGMODEL_SUBSCRIPTION_LIST_PATH),
  );
}

export async function validateZaiAccountProviderAvailability(
  providers: readonly CodingPlanAvailabilityProvider[],
  context: CodingPlanAvailabilityContext,
): Promise<Partial<Record<string, CodingPlanAvailabilityResult>>> {
  const startProvider = findAvailabilityProvider(providers, "zai", "start-plan");
  const individualProvider = findAvailabilityProvider(providers, "zai", "individual-coding-plan");
  const teamProvider = findAvailabilityProvider(providers, "zai", "team-coding-plan");
  return validateFamilyAccountProviders({
    family: "zai",
    context,
    startProvider,
    individualProvider,
    teamProvider,
  });
}

export async function validateBigModelAccountProviderAvailability(
  providers: readonly CodingPlanAvailabilityProvider[],
  context: CodingPlanAvailabilityContext,
): Promise<Partial<Record<string, CodingPlanAvailabilityResult>>> {
  const startProvider = findAvailabilityProvider(providers, "bigmodel", "start-plan");
  const individualProvider = findAvailabilityProvider(
    providers,
    "bigmodel",
    "individual-coding-plan",
  );
  const teamProvider = findAvailabilityProvider(providers, "bigmodel", "team-coding-plan");
  return validateFamilyAccountProviders({
    family: "bigmodel",
    context,
    startProvider,
    individualProvider,
    teamProvider,
  });
}

function findAvailabilityProvider(
  providers: readonly CodingPlanAvailabilityProvider[],
  family: ProviderFamilyDomain,
  planKind: CodingPlanAvailabilityProvider["planKind"],
): CodingPlanAvailabilityProvider | undefined {
  return providers.find((provider) => provider.family === family && provider.planKind === planKind);
}

async function validateFamilyAccountProviders(params: {
  family: ProviderFamilyDomain;
  context: CodingPlanAvailabilityContext;
  startProvider?: CodingPlanAvailabilityProvider;
  individualProvider?: CodingPlanAvailabilityProvider;
  teamProvider?: CodingPlanAvailabilityProvider;
}): Promise<Partial<Record<string, CodingPlanAvailabilityResult>>> {
  const unavailable = {
    kind: "unavailable" as const,
    reason: "coding_plan_not_connected" as const,
  };
  const result: Record<string, CodingPlanAvailabilityResult> = {};
  for (const provider of [params.startProvider, params.individualProvider, params.teamProvider]) {
    if (provider) result[provider.providerId] = unavailable;
  }

  const selection = params.context.providerFamilyConnectionSelections?.[params.family];
  // Start Plan 是独立权益：即使当前连接仍是个人/Team Coding Plan，也必须单独查询，
  // 否则领取后待生效或已拥有的 Start Plan 会被错误地当成“未连接”，设置页无法展示。
  // 个人订阅和 Start 独立查询，不以当前选中状态代替权益。Team 必须有具体项目身份。
  if (params.individualProvider) {
    result[params.individualProvider.providerId] = await validateCodingPlanProviderAvailability(
      params.individualProvider,
      params.context,
    );
  }
  if (selection?.kind === "team-coding-plan" && params.teamProvider) {
    result[params.teamProvider.providerId] = await validateSelectedTeamPlanAvailability(
      params.family,
      params.context,
    );
  } else if (params.teamProvider) {
    result[params.teamProvider.providerId] = { kind: "unknown" };
  }
  return result;
}

// zai/bigmodel Team Plan 对称化。原硬编码 bigmodel host/token/header，
// zai team plan 永远不校验 customerInfo（被移出团队也不禁用）。
// 泛化为 family-aware：按 family 选 host（zai 用配置的 ZAI Business origin）、token（oauth:zai:）、header（Bearer）。
// 已验证 zai 域名 getCustomerInfo 返回结构与 bigmodel 同构（organizations/projects）。
async function validateSelectedTeamPlanAvailability(
  family: ProviderFamilyDomain,
  context: CodingPlanAvailabilityContext,
): Promise<CodingPlanAvailabilityResult> {
  if (!context.apiClient) {
    return { kind: "unknown" };
  }
  const selectedTeamContext = resolveSelectedTeamContext(
    family,
    context.providerFamilyConnectionSelections,
  );
  if (!selectedTeamContext) {
    return { kind: "unknown" };
  }
  const { projectId } = selectedTeamContext;
  const oauthProvider = family === "zai" ? ZAI_PROVIDER_ID : BIGMODEL_PROVIDER_ID;
  const token = (
    await context.credentialService?.load(`oauth:${oauthProvider}:access_token`)
  )?.trim();
  if (!token) {
    return { kind: "unavailable", reason: "coding_plan_not_connected" };
  }
  const zcodeJwtToken = (await context.credentialService?.load(ZCODE_JWT_TOKEN_KEY))?.trim();
  // BigModel 旧版本可能把 zcodejwttoken 误写进 oauth access token；
  // 但 Z.ai 的 business JWT 本身就是合法 Bearer token，不能套用这个 stale-token 防御。
  if (family === "bigmodel" && zcodeJwtToken && token === zcodeJwtToken) {
    return { kind: "unavailable", reason: "coding_plan_not_connected" };
  }

  try {
    // zai 走 buildRuntimeZaiBusinessUrl（测试环境配置的 ZAI Business origin），
    // bigmodel 走 resolveBigModelApiOrigin。路径 /api/biz/customer/getCustomerInfo 两边同构。
    const host =
      family === "zai"
        ? buildRuntimeZaiBusinessUrl(process.env, "")
        : resolveBigModelApiOrigin(process.env);
    const authHeaders =
      family === "zai" ? createZaiLoginAuthHeaders(token) : createBigModelLoginAuthHeaders(token);
    const payload = await readApiJson<BigModelCustomerInfoEnvelope>(
      context.apiClient!,
      `${host}/api/biz/customer/getCustomerInfo`,
      {
        method: "GET",
        timeoutMs: REQUEST_TIMEOUT_MS,
        headers: authHeaders,
      },
    );
    if (!isSuccessfulBusinessEnvelope(payload)) return { kind: "unknown" };
    if (!Array.isArray(payload.data?.organizations)) return { kind: "unknown" };
    const resolvedTeamContext = resolveBigModelTeamProjectContext(
      payload.data,
      selectedTeamContext,
    );
    log.info(undefined, "Team Plan 入口项目校验完成", {
      family,
      projectId,
      organizationId: selectedTeamContext.organizationId,
      hasSelectedTeamProject: Boolean(resolvedTeamContext),
      organizationCount: payload.data?.organizations?.length ?? 0,
    });
    if (!resolvedTeamContext) {
      return { kind: "unavailable", reason: "coding_plan_not_entitled" };
    }
    return validateTeamPlanSubscriptionAvailability({
      apiClient: context.apiClient,
      authorization: token,
      family,
      host,
      teamContext: resolvedTeamContext,
    });
  } catch (error) {
    log.warn(undefined, "Team Plan 入口项目校验失败", {
      family,
      error: error instanceof Error ? error.message : String(error),
      projectId,
      status: error instanceof ApiError ? error.status : null,
    });
    return classifyAvailabilityError(error);
  }
}

async function validateTeamPlanSubscriptionAvailability(params: {
  apiClient: ApiClient;
  authorization: string;
  family: ProviderFamilyDomain;
  host: string;
  teamContext: BigModelTeamPlanBizContext;
}): Promise<CodingPlanAvailabilityResult> {
  try {
    const result = await fetchTeamCodingPlanEntitlement({
      ...params,
      authorization:
        params.family === "zai" ? `Bearer ${params.authorization}` : params.authorization,
      timeoutMs: REQUEST_TIMEOUT_MS,
    });
    return result.kind === "unavailable"
      ? { kind: "unavailable", reason: "coding_plan_not_entitled" }
      : { kind: result.kind };
  } catch (error) {
    return classifyAvailabilityError(error);
  }
}

// zai/bigmodel Team Plan 对称化。原仅解析 bigmodel selectedKey，
// zai team key 永远返回 null（availability 不校验 zai team project）。
// 泛化为 family-aware，按 family 读对应 selectedKey bucket + family-aware parse。
function resolveSelectedTeamContext(
  family: ProviderFamilyDomain,
  selections: ProviderFamilyConnectionSelectionSettings | null | undefined,
): {
  organizationId: string | null;
  projectId: string;
} | null {
  const selection = selections?.[family];
  if (selection?.kind !== "team-coding-plan") return null;
  return {
    organizationId: selection.organizationId,
    projectId: selection.projectId,
  };
}

function resolveBigModelTeamProjectContext(
  customerInfo: BigModelCustomerInfo | null | undefined,
  selectedContext: {
    organizationId: string | null;
    projectId: string;
  },
): BigModelTeamPlanBizContext | null {
  for (const organization of customerInfo?.organizations ?? []) {
    const organizationId = organization.organizationId?.trim() ?? "";
    if (selectedContext.organizationId && organizationId !== selectedContext.organizationId) {
      continue;
    }
    for (const project of organization.projects ?? []) {
      if (
        project.projectId?.trim() === selectedContext.projectId &&
        String(project.projectType ?? "").trim() === "2" &&
        organizationId
      ) {
        return {
          organizationId,
          projectId: selectedContext.projectId,
        };
      }
    }
  }
  return null;
}

async function validateSubscriptionListAvailability(
  provider: CodingPlanAvailabilityProvider,
  context: CodingPlanAvailabilityContext,
  url: string,
): Promise<CodingPlanAvailabilityResult> {
  // 账号凭据已是三段 PAT；旧手工 Key 归一化会按 id.secret 截掉签名。
  const authorization = (provider.apiKey ?? "").trim().replace(/^Bearer\s+/i, "").trim();
  // 请求期 Token 尚未准备好只能表示权益未知；不能用凭据缺失证明未订阅。
  if (!authorization) return { kind: "unknown" };
  try {
    const result = await fetchPersonalCodingPlanEntitlement({
      apiClient: context.apiClient!,
      authorization,
      url,
      timeoutMs: REQUEST_TIMEOUT_MS,
    });
    return result.kind === "unavailable"
      ? { kind: "unavailable", reason: "coding_plan_not_entitled" }
      : { kind: result.kind };
  } catch (error) {
    return classifyAvailabilityError(error);
  }
}

function classifyAvailabilityError(error: unknown): CodingPlanAvailabilityResult {
  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
    return { kind: "unavailable", reason: "coding_plan_auth_failed" };
  }
  return { kind: "unknown" };
}

function isSuccessfulBusinessEnvelope(payload: { code?: number; success?: boolean }): boolean {
  return (
    payload.success !== false &&
    (payload.code === undefined || payload.code === 0 || payload.code === 200)
  );
}
