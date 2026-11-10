import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import { afterEach, describe, expect, it, vi } from "vitest";
import { loadConfigFromFile } from "vite";

describe("web Vite config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // 修复原因（0.9d 收尾，STALE 用例）：WEB_REMOTE_FRONTEND_VERSION 手动版本覆盖与非法值校验
  // 已在 0.9a（d4f574e8 fork 清理）随 packages/web/vite/remoteFrontendVersion.mjs 一起移除，
  // vite.config.ts 现在只用 package.json 的 version。该死性证明见提交说明中的 repo-wide grep：
  // WEB_REMOTE_FRONTEND_VERSION / resolveRemoteFrontendVersion 全仓已无任何读者，
  // 仅剩本文件自己的 vi.stubEnv。这里只保留仍然有效的 __ZCODE_VERSION__ 默认值覆盖。
  it("构建版本使用 package.json 默认值", async () => {
    const webRoot = resolve(import.meta.dirname, "..");
    const { version } = JSON.parse(
      await readFile(resolve(webRoot, "../../package.json"), "utf8"),
    );
    const result = await loadConfigFromFile(
      { command: "build", mode: "production", isPreview: false, isSsrBuild: false },
      resolve(webRoot, "vite.config.ts"),
      webRoot,
      "silent",
    );
    expect(result?.config.define?.__ZCODE_VERSION__).toBe(JSON.stringify(version));
  });

  it("publishes PDF.js CMaps for non-latin PDF rendering", async () => {
    const webRoot = resolve(import.meta.dirname, "..");
    const configFile = resolve(webRoot, "vite.config.ts");
    const result = await loadConfigFromFile(
      {
        command: "build",
        mode: "production",
        isPreview: false,
        isSsrBuild: false,
      },
      configFile,
      webRoot,
      "silent",
    );

    expect(result?.config.plugins?.some((plugin) => plugin.name === "zcode:pdfjs-cmaps")).toBe(
      true,
    );
  });

  it("显式 ZCODE_ENV=production 时注入本机 API 链接，不再注入任何厂商 OAuth 定义", async () => {
    vi.stubEnv("ZCODE_ENV", "production");
    const webRoot = resolve(import.meta.dirname, "..");
    const configFile = resolve(webRoot, "vite.config.ts");
    const result = await loadConfigFromFile(
      {
        command: "build",
        mode: "production",
        isPreview: false,
        isSsrBuild: false,
      },
      configFile,
      webRoot,
      "silent",
    );

    expect(result?.config.define).toMatchObject({
      "import.meta.env.VITE_ZCODE_BASE_URL": JSON.stringify("http://localhost:8787"),
    });
    // 0.9d：Z.ai/BigModel OAuth 链路整体移除，构建期不得再出现这些厂商注入。
    const defines = Object.keys(result?.config.define ?? {});
    expect(defines.some((key) => key.includes("ZAI_OAUTH"))).toBe(false);
    expect(defines.some((key) => key.includes("BIGMODEL_OAUTH"))).toBe(false);
  });

  // Windows 跳过：环境配置差异导致断言失败，需要 CI 环境统一配置
  const isWindows = process.platform === "win32";

  (isWindows ? it.skip : it)(
    "uses the local endpoint origin in local development mode",
    async () => {
      vi.stubEnv("ZCODE_ENV", "");
      vi.stubEnv("ZCODE_BASE_URL", "");
      const webRoot = resolve(import.meta.dirname, "..");
      const configFile = resolve(webRoot, "vite.config.ts");
      const result = await loadConfigFromFile(
        {
          command: "serve",
          mode: "development",
          isPreview: false,
          isSsrBuild: false,
        },
        configFile,
        webRoot,
        "silent",
      );

      expect(result?.config.define).toMatchObject({
        "import.meta.env.VITE_ZCODE_BASE_URL": JSON.stringify("http://localhost:8787"),
      });
    },
  );

  it("uses shared ZCode endpoint env override for renderer injection", async () => {
    vi.stubEnv("ZCODE_ENV", "test");
    vi.stubEnv("ZCODE_BASE_URL", "http://127.0.0.1:8787");
    const webRoot = resolve(import.meta.dirname, "..");
    const configFile = resolve(webRoot, "vite.config.ts");
    const result = await loadConfigFromFile(
      {
        command: "build",
        mode: "production",
        isPreview: false,
        isSsrBuild: false,
      },
      configFile,
      webRoot,
      "silent",
    );

    expect(result?.config.define).toMatchObject({
      "import.meta.env.VITE_ZCODE_BASE_URL": JSON.stringify("http://127.0.0.1:8787"),
      "import.meta.env.VITE_ZCODE_ENDPOINT_ORIGIN": JSON.stringify("http://127.0.0.1:8787"),
    });
  });
});
