import type { ProviderConfigObject } from "@zcode/provider";

/**
 * 产品展示例外：套餐 GLM-5.3 的图片输入是服务端桥接，不能把桥接标为原生视觉。
 *
 * 账号套餐（Coding Plan）链路已在 0.9 删除：Provider 访问方式只剩 api-key，
 * 因此不再有"套餐访问"分支需要隐藏 GLM-5.3 徽标。
 */
export function shouldShowModelVisionBadge(
  modelId: string,
  supportsImage: boolean | null | undefined,
  access?: ProviderConfigObject["access"],
): boolean {
  void access;
  if (supportsImage !== true) return false;
  // 只控制徽标，不改能力事实、附件校验或精确模型身份。
  return true;
}
