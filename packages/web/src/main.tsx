import { createWebPlatform } from "#src/platform/index.js";
import type { ServerRemoteInfo } from "@zcode/shared";
import { createRoot } from "react-dom/client";
import {
  AppErrorBoundary,
  Root,
  ZCodeIntlProvider,
  generateMobileDeviceFingerprint,
  installDocumentHiddenMotionPause,
  setStreamClientId,
  type Theme,
} from "@zcode/ui";
import "./styles.css";
import { connectViaWebSocket } from "@zcode/client";

import {
  ConversationShareLandingLoader,
  ConversationShareLandingStatus,
} from "./share/ConversationShareLandingPage.js";
import {
  ConversationSharePreviewClient,
  resolveConversationShareRouteLocale,
} from "./share/conversationSharePreviewClient.js";
import {
  isConversationSharePath,
  resolveConversationShareCodeFromPath,
} from "./share/conversationShareRoute.js";

function resolveStoredWebTheme(defaultTheme: Theme): Theme {
  const saved = localStorage.getItem("zcode-theme");
  return saved === "system" ||
    saved === "light" ||
    saved === "dark" ||
    saved === "zai-light" ||
    saved === "zai-dark"
    ? saved
    : defaultTheme;
}

// 初始化主题：分享页默认浅色，其他 Web 页面默认深色；后续由 useTheme hook 接管。
{
  const saved = resolveStoredWebTheme(
    isConversationSharePath(window.location.pathname) ? "zai-light" : "zai-dark",
  );
  const resolved =
    saved === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : saved === "dark" || saved === "zai-dark"
        ? "dark"
        : "light";
  const appliedTheme =
    saved === "system"
      ? resolved === "dark"
        ? "zai-dark"
        : "zai-light"
      : saved === "dark"
        ? "zai-dark"
        : saved === "light"
          ? "zai-light"
          : saved;
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.classList.toggle("theme-zai-light", appliedTheme === "zai-light");
  document.documentElement.classList.toggle("theme-zai-dark", appliedTheme === "zai-dark");
}

// 浏览器标签页 / 手机切后台时禁用 CSS 动画，避免 DocumentTimeline 持有已卸载的 DOM 子树。
installDocumentHiddenMotionPause();
const root = createRoot(document.getElementById("root")!);

// 初始化 Web 端流式 clientId，确保所有 hook 在首次渲染前就使用稳定 ID
setStreamClientId(generateMobileDeviceFingerprint());

interface WebBootstrapResult {
  wsUrl: string;
  initialWorkspaceAbsPath?: string;
  initialWorkspaceIdentity?: string;
  initialTaskId?: string;
  restoreSession?: boolean;
  allowOpenWorkspace?: boolean;
}

function renderWebFailure(message: string): void {
  document.title = "ZCode - Web";
  root.render(
    <main className="flex h-full min-h-0 items-center justify-center bg-background px-4 py-8 text-foreground">
      <section className="w-full max-w-md rounded-lg border border-card-border bg-card p-6 shadow-sm">
        <div className="mb-4 text-ui-sm font-medium text-brand">ZCode</div>
        <h1 className="text-ui-xl font-semibold">Unable to load ZCode</h1>
        <p className="mt-3 text-ui-base leading-6 text-foreground-subtle">{message}</p>
        <button
          type="button"
          className="mt-5 rounded-md border border-border px-4 py-2 text-ui-base text-foreground"
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
      </section>
    </main>,
  );
}

async function renderConversationSharePage(): Promise<void> {
  // 页面语言跟随路径前缀：/cn/share 中文，裸 /share 英文。
  const routeLocale = resolveConversationShareRouteLocale(window.location.pathname);
  // index.html 固定 lang="en"；不同步会让中文分享页对无障碍与浏览器翻译都报错语言。
  document.documentElement.lang = routeLocale;
  // 分享页必须设置 title：否则浏览器标签只显示 index.html 的通用标题。
  // 会话标题要等 preview 加载完，先给一个语言正确的兜底。
  document.title = routeLocale === "zh-CN" ? "ZCode 会话分享" : "ZCode Conversation Share";
  const shareCode = resolveConversationShareCodeFromPath(window.location.pathname);
  if (!shareCode) {
    root.render(
      <ConversationShareLandingStatus
        state={{ kind: "error", error: "invalid_contract" }}
        locale={routeLocale}
      />,
    );
    return;
  }

  const endpointOrigin =
    import.meta.env.VITE_ZCODE_BASE_URL?.trim().replace(/\/+$/u, "") || window.location.origin;
  const mockMode =
    import.meta.env.DEV && import.meta.env.VITE_CONVERSATION_SHARE_PREVIEW_MOCK === "true";
  // Share 加载失败不能只有通用 network 文案：需要区分 mock、endpoint 配置或跨域 fetch。
  // 这里只记录运行时路由与 endpoint，不记录完整 pathname，避免把 share code 写入日志。
  console.info("[conversation-share-web]", "preview_runtime_initialized", {
    browserOrigin: window.location.origin,
    routeKind: "canonical",
    endpointOrigin,
    transport: mockMode ? "mock" : "fetch",
  });
  const client = mockMode
    ? new (
        await import("./share/mockConversationSharePreviewClient.js")
      ).MockConversationSharePreviewClient()
    : new ConversationSharePreviewClient({ baseUrl: `${endpointOrigin}/api/v1` });
  root.render(
    <ConversationShareLandingLoader
      shareCode={shareCode}
      client={client}
      locale={routeLocale}
      theme={resolveStoredWebTheme("zai-light")}
    />,
  );
}

function resolveDefaultWsOrigin(): string {
  return `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}`;
}

async function resolveWebBootstrap(): Promise<WebBootstrapResult> {
  const params = new URLSearchParams(window.location.search);
  const remoteId = params.get("remote");
  const wsUrl = remoteId
    ? `${resolveDefaultWsOrigin()}/ws/remote/${remoteId}`
    : `${resolveDefaultWsOrigin()}/ws`;

  if (remoteId) {
    return { wsUrl };
  }

  try {
    const response = await fetch("/api/server-info", {
      cache: "no-store",
    });
    if (!response.ok) {
      return { wsUrl };
    }
    const serverInfo = (await response.json()) as Partial<ServerRemoteInfo>;
    const workspace = Array.isArray(serverInfo.workspaces) ? serverInfo.workspaces[0] : undefined;
    return {
      wsUrl,
      ...(workspace?.path ? { initialWorkspaceAbsPath: workspace.path } : {}),
      ...(workspace?.workspaceIdentity
        ? { initialWorkspaceIdentity: workspace.workspaceIdentity }
        : {}),
    };
  } catch {
    return { wsUrl };
  }
}

async function bootstrapWebApp() {
  if (isConversationSharePath(window.location.pathname)) {
    await renderConversationSharePage();
    return;
  }

  let bootstrap: WebBootstrapResult;
  try {
    bootstrap = await resolveWebBootstrap();
  } catch (error) {
    renderWebFailure(error instanceof Error ? error.message : String(error));
    return;
  }

  try {
    const services = await connectViaWebSocket(bootstrap.wsUrl, {
      onClose: () => {},
    });
    const platform = createWebPlatform();
    document.title = "ZCode - Web + Server";

    root.render(
      <AppErrorBoundary>
        <ZCodeIntlProvider
          settingService={services.settingService}
          broadcastService={services.broadcastService}
        >
          <Root
            services={services}
            platform={platform}
            initialWorkspaceAbsPath={bootstrap.initialWorkspaceAbsPath}
            initialWorkspaceIdentity={bootstrap.initialWorkspaceIdentity}
            initialTaskId={bootstrap.initialTaskId}
            restoreSession={bootstrap.restoreSession}
            allowOpenWorkspace={bootstrap.allowOpenWorkspace}
            preferDirectoryBrowser
            supportsEmbeddedBrowser={false}
            allowRemoteWorkspace={false}
          />
        </ZCodeIntlProvider>
      </AppErrorBoundary>,
    );
  } catch (error) {
    renderWebFailure(error instanceof Error ? error.message : String(error));
  }
}

void bootstrapWebApp();
