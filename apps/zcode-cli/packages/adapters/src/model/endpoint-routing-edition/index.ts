import type { ProviderEndpointRoutingPort } from "@zcode/contracts";
import type { ProviderEndpointRoutingFactoryOptions } from "../provider-endpoint-routing-options.js";

/**
 * Riddi 不再把 BigModel/Z.ai 的 Anthropic 请求改写到 Z.ai 网关
 * （原 official-coding-plan-gateway 已删除）：endpoint routing 恒为直达，
 * 所有 provider 的请求都发往其原生 origin。保留 Port 抽象形状，
 * 使公共 fetch wrapper 与调用方的路由决策路径不变。
 */
export function createProviderEndpointRoutingPort(
  options: ProviderEndpointRoutingFactoryOptions,
): ProviderEndpointRoutingPort {
  void options;
  return {
    async resolve(requestUrl) {
      return { routed: false, url: requestUrl };
    },
  };
}
