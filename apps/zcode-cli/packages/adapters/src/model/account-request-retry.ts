import type { RequestVerificationReason } from "@zcode/shared";
import { isRequestSecurityFailure } from "@zcode/shared";
import type { Logger, ModelRequestAuth } from "@zcode/contracts";
import { RequestVerificationRetry } from "./request-security-edition/recovery.js";
import { inspectProviderFailure } from "./failure-classifier.js";
import {
  getApiCallResponseBody,
  getHttpResponseStatus,
  unwrapRetryError,
} from "./failure-inspection.js";
import type { AiSdkModelTextRequest, ResolvedAiSdkModel } from "./runner-runtime.js";

export class AccountRequestRetry {
  readonly #verification: RequestVerificationRetry;

  constructor(
    private readonly request: AiSdkModelTextRequest,
    private readonly model: ResolvedAiSdkModel,
    logger?: Logger,
  ) {
    this.#verification = new RequestVerificationRetry(request, model);
  }

  get extraAttempts(): number {
    return this.#verification.extraAttempts;
  }

  takeReason(): RequestVerificationReason {
    return this.#verification.takeReason();
  }

  prepareRequest(request: AiSdkModelTextRequest): AiSdkModelTextRequest {
    // 账号型请求已随 OAuth 移除；这里只保留请求安全恢复链。
    return request;
  }

  claim(error: unknown, blocked = false): boolean {
    return this.#verification.claim(error, blocked);
  }

  canRecoverProjectToken(_error: unknown, _blocked = false): boolean {
    // 账号型（含 Off-Peak/Coding Plan）请求随 OAuth 一并移除，不再存在项目令牌刷新路径。
    return false;
  }
}

export function isProjectTokenRejection(error: unknown): boolean {
  return (
    getHttpResponseStatus(unwrapRetryError(error)) === 401 &&
    !isOtherAuthRejection(error, new WeakSet<object>())
  );
}

function isOtherAuthRejection(error: unknown, seen: WeakSet<object>): boolean {
  const current = unwrapRetryError(error);
  if (!current || typeof current !== "object" || seen.has(current)) return false;
  seen.add(current);
  const details = inspectProviderFailure(current);
  return (
    isRequestSecurityFailure(getApiCallResponseBody(current), [
      details.providerErrorCode,
      details.providerErrorMessage,
    ]) ||
    ("cause" in current && isOtherAuthRejection(current.cause, seen))
  );
}
