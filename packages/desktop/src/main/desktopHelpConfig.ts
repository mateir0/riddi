import { net } from "electron";
import {
  buildHelpAppConfigUrl,
  buildZCodeSourceHeadersFromContext,
  createHelpAppConfigReader,
  ZCODE_ENV,
} from "@zcode/shared";

// Riddi 不接入 Z.ai 云端配置面：帮助/社群/反馈入口不再直连远端 /api/v1/client/configs，
// 与 forceUpdateGuard / singleFeatureRollout / clientConfigService 使用同一个总开关语义。
// 关闭时 help 表面只读本地内置 config/default.json，界面 degrade 到本地文案而不是拉取失败。
export const RIDDI_REMOTE_HELP_CONFIG_ENABLED = false;

export function createDesktopHelpConfigReader(options: {
  resolveEndpointOrigin: () => Promise<string>;
  appVersion: string;
  deviceMid: string;
  /** 当前界面语言；以前不传，X-Client-Language 固定为 unknown。 */
  getClientLanguage: () => string;
}) {
  const read = createHelpAppConfigReader({
    fetchImpl: (input, init) => net.fetch(input instanceof URL ? input.href : input, init),
  });
  return async () => {
    if (RIDDI_REMOTE_HELP_CONFIG_ENABLED === false) {
      // 远端配置已关闭：不发起任何网络请求，帮助表面回落到本地内置配置。
      return undefined;
    }
    const endpointOrigin = await options.resolveEndpointOrigin();
    return read(
      buildHelpAppConfigUrl(
        endpointOrigin,
        options.appVersion,
        `${process.platform}-${process.arch}`,
      ),
      buildZCodeSourceHeadersFromContext({
        endpointOrigin,
        appVersion: options.appVersion,
        clientLanguage: options.getClientLanguage(),
        deviceMid: options.deviceMid,
        platform: process.platform,
        arch: process.arch,
        releaseChannel: ZCODE_ENV,
        sourceTitle: "electron",
      }),
    );
  };
}
