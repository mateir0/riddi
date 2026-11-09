import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  ZCODE_BUILTIN_PROVIDER_CONFIG_FILE_ENV,
  ZCODE_PERSONAL_PROVIDER_CONFIG_FILE_ENV,
  ZCODE_BUILTIN_RELEASE_SCHEMA_VERSION,
} from "@zcode/provider-node";
import { afterEach, describe, expect, it } from "vitest";
import { startProcessProviderRegistryRuntime } from "../src/app/process-provider-registry-runtime.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("process provider registry runtime", () => {
  it("未注入 Provider Config 路径时拒绝启动", async () => {
    await expect(startProcessProviderRegistryRuntime({})).rejects.toThrow(
      "缺少进程 Provider Registry",
    );
  });

  it("Personal 文件损坏时保留原文件并以内存空配置启动", async () => {
    const root = await temporaryDirectory();
    const zcodeBuiltinFilePath = join(root, "zcode-builtin.json");
    const personalFilePath = join(root, "personal.json");
    await writeFile(
      zcodeBuiltinFilePath,
      JSON.stringify(zcodeBuiltinRelease({ providers: {}, templates: {}, models: [] })),
    );
    await writeFile(personalFilePath, "{not-json");
    const started = await startProcessProviderRegistryRuntime({
      [ZCODE_BUILTIN_PROVIDER_CONFIG_FILE_ENV]: zcodeBuiltinFilePath,
      [ZCODE_PERSONAL_PROVIDER_CONFIG_FILE_ENV]: personalFilePath,
    });
    try {
      expect(started.configuredDefaultModelSelection).toBeUndefined();
      expect(await readFile(personalFilePath, "utf8")).toBe("{not-json");
      await expect(
        started.modelSelectionConfigRepository.saveConfiguredDefault(undefined),
      ).rejects.toThrow();
    } finally {
      started.dispose();
    }
    await expect(started.modelSelectionConfigRepository.read()).rejects.toThrow("已 dispose");
    await expect(started.runtime.start()).rejects.toThrow("已 dispose");
  });

  it("从进程环境启动一份 Registry，并由调用方持有生命周期", async () => {
    const root = await temporaryDirectory();
    const zcodeBuiltinFilePath = join(root, "zcode-builtin.json");
    const personalFilePath = join(root, "personal.json");
    await writeFile(
      zcodeBuiltinFilePath,
      JSON.stringify(
        zcodeBuiltinRelease({
          providers: {},
          templates: {
            "zcode-template": {
              access: { type: "api-key" },
              api: {
                type: "anthropic-messages",
                baseUrl: "https://api.example.com",
              },
              builtinModelIds: ["model-a"],
            },
          },
          models: [completeZCodeBuiltinModelRule()],
        }),
      ),
      "utf8",
    );
    await writeFile(
      personalFilePath,
      JSON.stringify(
        personalRelease([
          {
            providerId: "personal-api",
            templateId: "zcode-template",
            config: {
              group: "standard-personal",
              access: { type: "api-key", apiKey: "secret" },
            },
          },
        ]),
      ),
      "utf8",
    );

    const started = await startProcessProviderRegistryRuntime({
      [ZCODE_BUILTIN_PROVIDER_CONFIG_FILE_ENV]: zcodeBuiltinFilePath,
      [ZCODE_PERSONAL_PROVIDER_CONFIG_FILE_ENV]: personalFilePath,
    });

    expect(started?.snapshot.registry.providers).toHaveLength(1);
    expect(started?.runtime.registryService.getModel("personal-api", "model-a")).toBeDefined();
    expect(started?.runtime.registryService.getProvider("personal-api")).toBeDefined();
    started?.dispose();
  });
});

async function temporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "zcode-process-provider-registry-"));
  temporaryDirectories.push(directory);
  return directory;
}

function completeZCodeBuiltinModelRule() {
  return {
    modelMatch: ".*",
    config: {
      enabled: true,

      properties: {
        requiresMfjsToolSchema: false,
        contextWindow: 200_000,
        inputFormat: {
          supportsText: true,
          supportsImage: false,
          supportsVideo: false,
          supportsAudio: false,
          supportsPdf: false,
        },
        outputFormat: { supportsText: true },
        supportsToolCall: true,
        supportsJsonSchemaOutput: true,
        supportsNativeWebSearch: false,
        supportsMidConversationSystem: false,
      },
      optionSpecs: {
        reasoningLevel: { values: ["disabled"], map: "{}" },
        maxOutputTokens: {
          max: 32_000,
          map: '{"max_completion_tokens":maxOutputTokens}',
        },
      },
    },
  } as const;
}

function zcodeBuiltinRelease(input: {
  readonly providers: object;
  readonly templates: object;
  readonly models: readonly unknown[];
}): object {
  return {
    schemaVersion: ZCODE_BUILTIN_RELEASE_SCHEMA_VERSION,
    revision: 1,
    config: {
      providerConfigRules: {
        providerRules: Object.entries(input.providers).map(([providerId, config]) => ({
          providerId,
          config,
        })),
        templateRules: Object.entries(input.templates).map(([templateId, config]) => ({
          templateId,
          templateNameMap: { "en-US": templateId, "zh-CN": templateId },
          config,
        })),
      },
      modelConfigRules: {
        modelRules: input.models,
        modelApiRules: [],
        providerSiteRules: [],
        templateModelRules: [],
        builtinProviderModelRules: [],
      },
    },
  };
}

function personalRelease(providerRules: readonly unknown[]) {
  return {
    schemaVersion: 1,
    config: {
      providerConfigRules: { providerRules },
      modelConfigRules: { providerModelRules: [], manualProviderModelRules: [] },
    },
  };
}
