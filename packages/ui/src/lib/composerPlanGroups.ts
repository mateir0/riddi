import type { ModelSelectGroup, ModelSelectGroupItem } from "@/ModelConfigSelect.js";

/**
 * Composer 的 Provider 菜单分组。
 *
 * 账号套餐（Coding Plan）链路已在 0.9 删除：菜单不再按"账号连接"分组，
 * 直接展示 Registry 发布的 Provider 分组；连接切换退化为普通选模。
 */
export interface ComposerConnection {
  key: string;
  label: string;
  providerId: string;
  items: ModelSelectGroupItem[];
  /** 连接不可用时的展示态；普通 Provider 分组恒为 false。 */
  disabled?: boolean;
}

export interface ComposerPlanGroup extends ModelSelectGroup {
  connection?: ComposerConnection;
}

export function chooseConnectionModel(
  items: readonly ModelSelectGroupItem[],
  model?: string,
): ModelSelectGroupItem | undefined {
  return items.find((item) => item.name === model) ?? items[0];
}

/** 账号连接已删除：不再需要连接键，保留纯函数形状供调用方判断"当前连接"。 */
export function composerConnectionKey(providerId: string): string {
  return providerId;
}

export function buildComposerPlanGroups(
  groups: readonly ModelSelectGroup[],
): readonly ComposerPlanGroup[] {
  return [...groups];
}
