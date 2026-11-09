import { ModelSelectionFacade, type ProviderRegistryFacadeSource } from "@zcode/provider";
import { resolveLegacyReasoningLevel } from "./legacy-reasoning-level.js";

/** Host 与受管理 Worker 共用身份分类；解析仍由纯 Provider Facade 负责。 */
export function createNodeModelSelectionFacade(
  source: ProviderRegistryFacadeSource,
): ModelSelectionFacade {
  return new ModelSelectionFacade(
    source,
    // 账号连接解析已随账号链路移除；所有 Provider 现在都是普通 Provider。
    () => "ordinary",
    resolveLegacyReasoningLevel,
  );
}
