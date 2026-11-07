import http from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createProviderEndpointRoutingPort } from "../src/model/endpoint-routing-edition/index.js";
import { createProviderEndpointRoutingFetch } from "../src/model/provider-endpoint-routing-fetch.js";

const BIGMODEL_SOURCE = "https://open.bigmodel.cn/api/anthropic/v1/messages";
const ZAI_SOURCE = "https://api.z.ai/api/anthropic/v1/messages";
const NIM_SOURCE = "https://integrate.api.nvidia.com/v1/chat/completions";
const ORIGIN = "https://gateway.example.test";

function createPort() {
  return createProviderEndpointRoutingPort({
    endpointOrigin: ORIGIN,
    httpClient: undefined as never,
  });
}

afterEach(() => vi.unstubAllGlobals());

describe("provider endpoint routing (direct, no gateway rewrite)", () => {
  it.each([
    BIGMODEL_SOURCE,
    "https://OPEN.BIGMODEL.CN:443/api/anthropic/v1/messages/",
    ZAI_SOURCE,
    NIM_SOURCE,
    "http://open.bigmodel.cn/api/anthropic/v1/messages",
    "https://open.bigmodel.cn:444/api/anthropic/v1/messages",
    "https://open.bigmodel.cn/api/anthropic/v1/messages/count_tokens",
    "https://sub.open.bigmodel.cn/api/anthropic/v1/messages",
    "not a URL",
  ])("leaves %s unchanged and never routes via a gateway", async (url) => {
    const network = vi.fn(() => {
      throw new Error("unexpected configuration request");
    });
    vi.stubGlobal("fetch", network);
    await expect(createPort().resolve(`${url}`)).resolves.toEqual({ routed: false, url });
    expect(network).not.toHaveBeenCalled();
  });

  it("preserves query strings on direct resolution", async () => {
    await expect(createPort().resolve(`${BIGMODEL_SOURCE}?id=a%2Bb&empty=`)).resolves.toEqual({
      routed: false,
      url: `${BIGMODEL_SOURCE}?id=a%2Bb&empty=`,
    });
    await expect(createPort().resolve(`${ZAI_SOURCE}?id=a%2Bb&empty=`)).resolves.toEqual({
      routed: false,
      url: `${ZAI_SOURCE}?id=a%2Bb&empty=`,
    });
  });

  it.each(["string", "URL", "Request"])(
    "uses the common transport with %s input and sends to the native origin",
    async (kind) => {
      const controller = new AbortController();
      const body = JSON.stringify({ stream: true, model: "example" });
      const init = {
        method: "POST",
        body,
        signal: controller.signal,
        headers: {
          Host: "open.bigmodel.cn",
          Authorization: "Bearer example",
          "x-api-key": "example-key",
        },
      };
      const response = new Response("data: first\n\ndata: second\n\n", { status: 200 });
      let sent: Request | undefined;
      const transport = createProviderEndpointRoutingFetch({
        routingPort: createPort(),
        fetch: async (input, options) => {
          sent = new Request(input, options);
          return response;
        },
      });
      const input =
        kind === "Request"
          ? new Request(BIGMODEL_SOURCE, init)
          : kind === "URL"
            ? new URL(BIGMODEL_SOURCE)
            : BIGMODEL_SOURCE;
      expect(await transport(input, kind === "Request" ? undefined : init)).toBe(response);
      expect(sent?.url).toBe(BIGMODEL_SOURCE);
      expect(sent?.method).toBe("POST");
      // 直达不改写目标，Host 头保留为原生 endpoint 的主机名（改写时才会被剥离）。
      expect(sent?.headers.get("host")).toBe("open.bigmodel.cn");
      expect(sent?.headers.get("authorization")).toBe("Bearer example");
      expect(sent?.headers.get("x-api-key")).toBe("example-key");
      await expect(sent?.text()).resolves.toBe(body);
      controller.abort();
      expect(sent?.signal.aborted).toBe(true);
      await expect(response.text()).resolves.toBe("data: first\n\ndata: second\n\n");
    },
  );

  it("sends the request directly to the native endpoint over real HTTP", async () => {
    const received: Array<{
      url: string;
      host: string | undefined;
      auth: string | undefined;
      body: string;
    }> = [];
    const server = http.createServer(async (request, response) => {
      const chunks: Buffer[] = [];
      for await (const chunk of request) chunks.push(Buffer.from(chunk));
      received.push({
        url: request.url!,
        host: request.headers.host,
        auth: request.headers.authorization,
        body: Buffer.concat(chunks).toString(),
      });
      response.writeHead(200, { "content-type": "text/event-stream" });
      response.end("data: complete\n\n");
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    const nativeUrl = `${origin}/api/anthropic/v1/messages`;
    try {
      const fetch = createProviderEndpointRoutingFetch({
        routingPort: createPort(),
        fetch: globalThis.fetch,
      });
      const response = await fetch(`${nativeUrl}?stream=true`, {
        method: "POST",
        body: "request-body",
        headers: { Host: "open.bigmodel.cn", Authorization: "Bearer example" },
      });
      expect(await response.text()).toBe("data: complete\n\n");
      expect(received).toEqual([
        {
          url: "/api/anthropic/v1/messages?stream=true",
          host: new URL(origin).host,
          auth: "Bearer example",
          body: "request-body",
        },
      ]);
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });
});
