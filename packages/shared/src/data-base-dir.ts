import { homedir } from "node:os";

/** 环境变量名：数据根目录覆盖（优先级：显式参数 > 环境变量 > 系统主目录） */
export const ZCODE_DATA_BASE_DIR_ENV = "ZCODE_DATA_BASE_DIR";

/** 已缓存的显式设置（优先级最高，仅在进程内生效） */
let _explicitDataBaseDir: string | null = null;

/** 设置显式数据根目录（优先级最高，仅在当前进程内生效） */
export function setExplicitDataBaseDir(dir: string | null): void {
  _explicitDataBaseDir = dir?.trim() || null;
}

/**
 * 解析数据根目录。
 * 优先级：显式参数 > 环境变量 ZCODE_DATA_BASE_DIR > HOME/USERPROFILE > homedir()
 * 返回已解析的绝对路径，不包含尾随斜杠。
 */
export function resolveDataBaseDir(options?: {
  /** 显式指定的目录（优先级最高，仅本次调用生效） */
  explicitDir?: string | null;
  /** 环境变量对象（默认 process.env） */
  env?: NodeJS.ProcessEnv;
}): string {
  // 1. 显式参数（本次调用最高优先级）
  if (options?.explicitDir) {
    return resolveExplicitDir(options.explicitDir);
  }

  // 2. 进程级显式设置（setExplicitDataBaseDir 设置）
  if (_explicitDataBaseDir) {
    return _explicitDataBaseDir;
  }

  // 3. 环境变量 ZCODE_DATA_BASE_DIR
  const env = process.env;
  const envDir = process.env.ZCODE_DATA_BASE_DIR?.trim();
  if (envDir) {
    return resolveExplicitDir(envDir);
  }

  // 4. HOME / USERPROFILE
  const homeEnv = process.env.HOME?.trim() || process.env.USERPROFILE?.trim();
  if (homeEnv) {
    return homeEnv;
  }

  // 5. 兜底：系统主目录
  return homedir();
}

function resolveExplicitDir(dir: string): string {
  const trimmed = dir.trim();
  if (!trimmed) {
    throw new Error("Explicit data base directory is empty");
  }
  return trimmed;
}

/** 兼容旧 API：仅读取环境变量和系统主目录，不含显式参数和进程级缓存。 */
export function resolveLegacyDataBaseDir(env?: NodeJS.ProcessEnv): string {
  const envObj = env ?? process.env;
  const envDir = envObj.ZCODE_DATA_BASE_DIR?.trim();
  if (envDir) return envDir;
  const homeEnv = envObj.HOME?.trim() || envObj.USERPROFILE?.trim();
  if (homeEnv) return homeEnv;
  return homedir();
}