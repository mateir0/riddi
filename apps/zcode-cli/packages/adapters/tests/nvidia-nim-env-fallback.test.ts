import http, { type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { generateText } from "ai";
import { describe, expect, it, afterEach } from "vitest";
import {
  AiSdkModelExecution,
  type AiSdkModelExecutionConfig,
  type AiSdkModelExecutionOptions,
} from "../src/model/model-execution.js";

describe("NVIDIA NIM template API key env fallback", () => {
  const originalEnv = process.env.NVIDIA_API_KEY;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.NVIDIA_API_KEY;
    } else {
      process.env.NVIDIA_API_KEY = originalEnv;
    }
  });

  async function listenServer(server: Server): Promise<string> {
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", () => {
        server.off("error", reject);
        resolve();
      });
    });
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Expected TCP server address");
    }
    return `http://127.0.0.1:${(address as AddressInfo).port}`;
  }

  async function closeServer(server: Server): Promise<void> {
    if (!server.listening) return;
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  function createExecution(config: AiSdkModelExecutionConfig = {}, options: AiSdkModelExecutionOptions = {}) {
    return new AiSdkModelExecution(config, options);
  }

  function createProviderConfig(baseURL: string, apiKey?: string) {
    return {
      access: apiKey ? { type: "api-key", apiKey } : { type: "api-key" },
      api: {
        type: "openai-chat-completions" as const,
        baseUrl: baseURL,
      },
      builtinModelIds: ["nvidia/nemotron-3-ultra"],
      personalModelIds: [],
      enabled: true,
      modelOrder: [],
    } as const;
  }

  function createModelConfig() {
    return {
      enabled: true,
      properties: {
        requiresMfjsToolSchema: false,
        contextWindow: 128000,
        inputFormat: { supportsText: true, supportsImage: false, supportsVideo: false, supportsAudio: false, supportsPdf: false },
        outputFormat: { supportsText: true },
        supportsToolCall: true,
        supportsJsonSchemaOutput: true,
        supportsNativeWebSearch: false,
        supportsMidConversationSystem: false,
      },
      optionSpecs: {
        reasoningLevel: { values: ["disabled"], map: "{}" },
        maxOutputTokens: { max: 4096, map: '{"max_completion_tokens": maxOutputTokens}' },
      },
    } as const;
  }

  async function runTest(
    templateId: string,
    providerConfig: ReturnType<typeof createProviderConfig>,
    expectedAuth: string | undefined
  ) {
    const receivedHeaders: http.IncomingHttpHeaders[] = [];
    const server = http.createServer((request, response) => {
      receivedHeaders.push(request.headers);
      request.resume();
      response.writeHead(200, { "content-type": "application/json" });
      response.end(
        JSON.stringify({
          id: "chatcmpl-test",
          object: "chat.completion",
          model: "nvidia/nemotron-3-ultra",
          choices: [{ index: 0, message: { role: "assistant", content: "ok" }, finish_reason: "stop" }],
          usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
        }),
      );
    });

    try {
      const baseURL = await listenServer(server);
      const providerConfigWithServer = createProviderConfig(baseURL, providerConfig.access.apiKey);
      const execution = createExecution();
      const bound = execution.bindModel({
        providerId: "nvidia-nim-provider",
        modelId: "nvidia/nemotron-3-ultra",
        providerConfig: providerConfigWithServer,
        supportsJsonSchemaOutput: true,
        optionSpecs: createModelConfig().optionSpecs,
        templateId,
      });
      const resolved = bound.resolveRequest({
        options: { maxOutputTokens: 1024, reasoningLevel: "disabled" },
      });
      await generateText({ model: resolved.model, prompt: "hello" });
      expect(receivedHeaders[0].authorization).toBe(expectedAuth);
    } finally {
      await closeServer(server);
    }
  }

  it("(a) stored key present + env set → stored key used", async () => {
    process.env.NVIDIA_API_KEY = "env-should-not-be-used";
    await runTest("nvidia-nim", createProviderConfig("", "stored-key"), "Bearer stored-key");
  });

  it("(b) no stored key + env set → env key used", async () => {
    process.env.NVIDIA_API_KEY = "env-key-from-process";
    await runTest("nvidia-nim", createProviderConfig("", undefined), "Bearer env-key-from-process");
  });

  it("(c) no stored key + env unset → result identical to today (no key)", async () => {
    delete process.env.NVIDIA_API_KEY;
    await runTest("nvidia-nim", createProviderConfig("", undefined), undefined);
  });

  it("(d) a different template + env set → env key NOT used", async () => {
    process.env.NVIDIA_API_KEY = "env-key-should-not-be-used";
    await runTest("moonshot-kimi", createProviderConfig("", undefined), undefined);
  });

  it("(e) after a resolution that used the env fallback, the credential storage content is unchanged", async () => {
    process.env.NVIDIA_API_KEY = "env-fallback-key";
    const execution = createExecution();
    const providerConfig = createProviderConfig("https://example.com/v1", undefined); // no stored key
    const originalConfig = JSON.stringify(providerConfig);
    
    const bound = execution.bindModel({
      providerId: "nvidia-nim-provider",
      modelId: "nvidia/nemotron-3-ultra",
      providerConfig,
      supportsJsonSchemaOutput: true,
      optionSpecs: createModelConfig().optionSpecs,
      templateId: "nvidia-nim",
    });
    const resolved = bound.resolveRequest({
      options: { maxOutputTokens: 1024, reasoningLevel: "disabled" },
    });
    
    // Verify the model works with the env key by making a request
    await runTest("nvidia-nim", createProviderConfig("", undefined), "Bearer env-fallback-key");
    
    // But the original provider config should be unchanged
    expect(JSON.stringify(providerConfig)).toBe(originalConfig);
    expect(providerConfig.access.apiKey).toBeUndefined();
  });

  it("whitespace-only env value is treated as absent", async () => {
    process.env.NVIDIA_API_KEY = "   \t\n  ";
    await runTest("nvidia-nim", createProviderConfig("", undefined), undefined);
  });

  it("empty string env value is treated as absent", async () => {
    process.env.NVIDIA_API_KEY = "";
    await runTest("nvidia-nim", createProviderConfig("", undefined), undefined);
  });
});