# FORK.md — Riddi fork audit (audit only, nothing renamed/applied)

Repo: fork of `zai-org/ZCode` (Apache-2.0), upstream version `3.17.2` (`package.json:3`), sync commit `a9fe401e`.
Purpose: map every surface that LATER prompts will touch to (a) strip Z.ai/GLM hardcoding, (b) make NVIDIA NIM the default provider, (c) rename the app to **Riddi**.
Status of this document: inventory only. No code, config, provider, UI, copy, update, or telemetry behaviour was changed by the audit that produced it. The only file added is this file.

How to read marks: **KEEP** = leave as-is in the fork · **STRIP** = remove in a later prompt · **REPLACE-WITH-NIM** = replace with an NVIDIA NIM equivalent (`openai-chat-completions` against `https://integrate.api.nvidia.com/v1`, API key referenced by env var name `NVIDIA_API_KEY` only — never a literal key).

Counting rule for the verification lines: a "surface" / "touchpoint" is one numbered `R-nn` / `Z-nn` row below, and every row carries at least one exact file path. Sub-rows inside Z-01/Z-02 are the full template/provider lists those rows own.

---

## 0. TARGET NAMES (do not apply in this prompt)

| Item | Target |
|---|---|
| Display name | Riddi |
| Slug | `riddi` |
| Config dir | `~/.riddi` |
| CLI binary | `riddi` |
| appId (proposed, following existing format `dev.zcode.app` at `packages/desktop/scripts/desktop-product-identity.mjs:10`) | `dev.riddi.app` (preview: `dev.riddi.app.preview`, following `dev.zcode.app.preview` at `packages/desktop/scripts/desktop-product-identity.mjs:19`) |

---

## 0.1.1 Rename surface inventory

Identity is unusually centralised for appId/productName (`packages/desktop/scripts/desktop-product-identity.mjs`), but the string `zcode` is load-bearing in the deep-link scheme, `~/.zcode` data dirs shared by Desktop/CLI/Server, the `@zcode/*` package scope, the `zcode` binaries, and `zcode.z.ai` endpoints baked into `packages/shared/src/zcodeEndpoint.ts`, `.env*`, and `config/provider/zcode-builtin.json`.

### App identity

| # | Surface (current value) | File path |
|---|---|---|
| R-01 | Production appId `dev.zcode.app` (+ Windows AUMID when packaged) | `packages/desktop/scripts/desktop-product-identity.mjs:10` |
| R-02 | Preview appId `dev.zcode.app.preview` | `packages/desktop/scripts/desktop-product-identity.mjs:19` |
| R-03 | Dev (unpackaged) Windows AUMID `cn.aminer.zcode` | `packages/desktop/scripts/desktop-product-identity.mjs:87` |
| R-04 | productName `ZCode` / `ZCode Preview` | `packages/desktop/scripts/desktop-product-identity.mjs:11,20` |
| R-05 | Linux executable/package `zcode` / `zcode-preview` | `packages/desktop/scripts/desktop-product-identity.mjs:12-13,21-22` |
| R-06 | electron-builder wiring of appId/productName/artifact name, Linux `executableName`/`packageName`, homepage `https://zcode.z.ai`, author `ZCode <dev@zcode.z.ai>` | `packages/desktop/electron-builder.config.js:592,622,276,858,871-874,927-948,598,601,929` |
| R-07 | Desktop package `productName: ZCode`, description "ZCode Desktop App", author | `packages/desktop/package.json:134,4-5` |
| R-08 | Runtime app name (`app.setName`, `process.title`, Electron userData dir name) `ZCode`/`ZCode Dev`/`ZCode Preview`; override env `ZCODE_DESKTOP_APPLICATION_NAME` | `packages/desktop/src/main/desktopRuntimeEnv.ts:65-79`, applied `packages/desktop/src/main/index.ts:310,320,323` |
| R-09 | Identity tests asserting the above values | `packages/desktop/test/desktopProductIdentity.test.ts:28-29,83-84,96-111` |
| R-10 | CUA Helper app/bundle identity `ZCode Computer Use.app`, `ZCode Computer Use Dev.app` | `packages/zcode-cua/broker-helper-constants.js:1-3`; defaults in `scripts/doctor-macos-release-app.sh:5,23,28` |

### Package names

| # | Surface | File path |
|---|---|---|
| R-11 | Root package name `zcode` (+ `build:zcode` script) | `package.json:2,40` |
| R-12 | `@zcode/*` workspace packages: client, desktop, e2e-report, formal-proof, model-option-map, provider, provider-node, rpc, server, services, share-ui, shared, stream-animate, ui, web, web-share | `packages/{client,desktop,e2e-report,formal-proof,model-option-map,provider,provider-node,rpc,server,services,share-ui,shared,stream-animate,ui,web,web-share}/package.json` |
| R-13 | `@zcode/zcode-cua`, `@zcode/server-cli`, CLI app `zcode-cli`, `@zcode/dev-docs` | `packages/zcode-cua/package.json`, `packages/zcode-server-cli/package.json`, `apps/zcode-cli/package.json`, `apps/dev-docs/package.json` |
| R-14 | CLI sub-packages `@zcode/<dir>` (adapters, cli, core, bootstrap, contracts, telemetry, tui, all `*-plugin`, …) and tools `@zcode/{prompt-trajectory,provider-regression,typescript}`; unscoped e2e pkgs `zcode-*-e2e` | `apps/zcode-cli/packages/*/package.json`, `apps/zcode-cli/tools/*/package.json`, `apps/zcode-cli/e2e/*/package.json` |
| R-15 | Lockfile + workspace/architecture references to `@zcode/*` and `zcode` paths | `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `architecture-policy.yaml:46-68`, `.oxlintrc.json:107-108`, `.oxfmtrc.json:7,9` |
| R-16 | Branded directory/module names: `apps/zcode-cli/`, `packages/zcode-cua/`, `packages/zcode-server-cli/`, `packages/shared/src/zcode-protocol*`, `packages/services/src/zcode-agent/`, `scripts/zcode-distribution*`, `specs/zcode-unified-distribution.md`, `config/provider/zcode-builtin.json` | directories/files as listed |

### Display-name strings and logos

| # | Surface | File path |
|---|---|---|
| R-17 | Desktop window title `ZCode` (+ inline "Z" startup-logo SVG) | `packages/desktop/src/renderer/index.html:6` |
| R-18 | Web window titles `ZCode`, "ZCode Conversation Share" | `packages/web/index.html:15`, `packages/web-share/index.html:8`, `apps/dev-docs/index.html:6` |
| R-19 | Dynamic document titles; share download URL `ZCODE_DOWNLOAD_URL=https://zcode.z.ai` | `packages/web/src/main.tsx:289,314,381,414,819,1539,1664,1832`; `packages/web-share/src/main.tsx:61,75` |
| R-20 | Other HTML titles: "ZCode Computer Use", plugin sandbox, "ZCode Endpoint" | `packages/desktop/src/renderer/cua-permission-panel.html:5`, `packages/desktop/src/renderer/plugin-sandbox.html:6`, `packages/desktop/src/main/desktopCommandHandlers.ts:315` |
| R-21 | Logo components and assets in app UI | `packages/ui/src/components/ui/ZCodeAboutLogo.tsx`, `packages/ui/src/components/mobile-ui/ZCodeAppLogo.tsx`, `packages/ui/src/WindowsTopLeftLogo.tsx`, `packages/ui/src/assets/riddi-app-icon.png`（与 `packages/desktop/build/icon.png` 同源的 Riddi 应用图标副本，已替换原 `assets/Z.svg` 与 `assets/provider-icons/logo-zai.svg` 的引用）, `packages/ui/src/onboarding/onboardingLogoSweep.css`; CLI ASCII logo `ZCODE_LOGO_LINES` in `apps/zcode-cli/packages/tui/src/app-empty-transcript.ts` |
| R-22 | Docs/branding surfaces | `DESIGN.md:1,28`, `CONTEXT.md:1,10`, `README.md`, `README.en.md`, `.vscode/launch.json:5,26,45,53,73-85` |
| R-23 | Model-facing identity: `Z Code@cli` / `Z Code@electron` X-Title, `User-Agent: ZCode/<version>`, `X-ZCode-Authorization`, `x-zcode-*` headers | `packages/shared/src/zcode-source-headers.ts:1-39`, `packages/shared/src/tool-identity.ts`; spec `apps/zcode-cli/docs/design/v2/model/provider-endpoint-routing.md:176-182` |
| R-24 | System-prompt identity prefix "ZCode CLI" | `apps/zcode-cli/packages/core/src` (search `ZCode CLI`); plan `apps/zcode-cli/docs/plan/trajectory/completed/system-prompt-alignment-implementation-plan.md:17,29-42` |

### Icon assets

| # | Surface | File path |
|---|---|---|
| R-25 | App icons used by electron-builder (`icon.icns/ico/png`, `icon_installer.*`, `icon_windows.png`, `icons/{16..1024}x*.png`, `dmg_background{,@2x}.png`) | `packages/desktop/build/`; wired in `packages/desktop/electron-builder.config.js` (dmg `icon: build/icon_installer.icns`, nsis `installerIcon: build/icon_installer.ico`) |
| R-26 | Repo-root logo set | `public/logo/icons/icon.icns`, `public/logo/icons/icon.ico` (+ siblings under `public/logo/`) |
| R-27 | Favicons | `packages/web/public/favicon.ico`, `docs/knip/docs/public/favicon.ico`, inline data-URI favicon in `packages/web/index.html` |
| R-28 | CUA helper / tray icon usage | `packages/desktop/src/main/desktopTray.ts:17`, `packages/desktop/src/main/desktopCuaPermissionIpc.ts:33` |

### CLI binary `zcode`

| # | Surface | File path |
|---|---|---|
| R-29 | npm bin `zcode` → `./dist/zcode.cjs` for `@zcode/cli` | `apps/zcode-cli/packages/cli/package.json` (`"bin"`) |
| R-30 | Second npm bin also named `zcode` → `./dist/server-cli.js` for `@zcode/server-cli` (rename collision to resolve) | `packages/zcode-server-cli/package.json` (`"bin"`); prints `product: "zcode-server"` at `packages/zcode-server-cli/src/cli.ts:125` |
| R-31 | Build outputs: `dist/zcode.cjs`, SEA binaries `zcode[.exe]`, desktop bundles CLI as `glm/zcode.cjs` | `apps/zcode-cli/packages/cli/scripts/build.mjs:165`, `apps/zcode-cli/packages/cli/scripts/build-sea.mjs:59,189,296`, `packages/desktop/electron-builder.config.js:826-827` |
| R-32 | Unified distribution: builds `agent/zcode.cjs`, tarball `dist/zcode/releases/<v>/zcode-<v>.tar.gz`, installs `zcode` launcher into `~/.local/bin`, prints "ZCode $VERSION installed." | `scripts/build-zcode.mjs:17,160,186`, `scripts/zcode-distribution/installer.mjs:7-9,51`, `scripts/zcode-distribution/runner.mjs:183-189,212`, root script `build:zcode` (`package.json:40`), spec `specs/zcode-unified-distribution.md:1-46` |
| R-33 | Plugin/script registrations of the `zcode` command; remote deploy path `~/.zcode/server/bin/zcode` | `.zcode-plugin/plugin.json` in each `apps/zcode-cli/packages/*-plugin/`, `packages/zcode-server-cli/scripts/verify-proxy-stdio-*.mjs:67,75`, `packages/server/src/remote/`, `docs/architecture/r2/r3*.md` |

### User config / data directories

| # | Surface (current value) | File path |
|---|---|---|
| R-34 | `~/.zcode/` root = `{dataBaseDir}/.zcode`; override env `ZCODE_DATA_BASE_DIR` | `packages/services/src/paths.ts:45-47,57ff` (`getZCodeDataRootDir()`) |
| R-35 | `~/.zcode/v2/` contents: `credentials.json`, `config.json`, `provider_config.json`, `tasks-index.sqlite`, `sessions/`, `telemetry-state.json`, `logs/`, `AGENTS.md`, `export-log*`, `feedback`, `git-checkpoint-index`, `v2/sessions/{hash}` | `packages/services/src/paths.ts:55-57,72-74,182-254` |
| R-36 | `~/.zcode/cli/`: `config.json`, `db/db.sqlite`, `log/`, `debug/`, `rollout/`, `plugins/`, `workflows/`, mailbox; CLI storage profile root; session DB overrides `ZCODE_SESSION_DB_PATH`/`ZCODE_SESSION_DB` | `packages/services/src/paths.ts:247-254`; `apps/zcode-cli/packages/adapters/src/storage/zcode-storage-root.ts` |
| R-37 | Dev profile `.zcode-dev`, dev home `~/.zcode-dev-home` | `apps/zcode-cli/packages/adapters/src/storage/zcode-storage-root.ts`; `mise.toml:20` (`ZCODE_DATA_BASE_DIR=~/.zcode-dev-home`); `README.md:63-66` |
| R-38 | Electron userData `appData/<ZCode\|ZCode Dev\|ZCode Preview>` (NOT `~/.zcode`); holds `zcode-data-size-telemetry.json`, `remote-assets-cache/`, partitions `persist:zcode-embedded-browser`, `persist:zcode-coding-plan`, `persist:plugin-sandbox-v2-*` | `packages/desktop/src/main/desktopRuntimeEnv.ts:65-79`; `packages/desktop/src/main/index.ts:2603`; `packages/desktop/src/main/pluginSandbox/contract.ts:27-28` |
| R-39 | Server root `~/.zcode/server/` (`releases/`, `bin/zcode`, `current.json`); override `ZCODE_SERVER_ROOT` | `packages/zcode-server-cli/src/runtime/paths.ts:27`, `packages/zcode-server-cli/src/runtime/stableLauncher.ts:48-54` |
| R-40 | Unified-dist runtime `~/.zcode/runtime`; override `ZCODE_DIST_HOME` | `scripts/zcode-distribution/installer.mjs:8` |
| R-41 | Workspace-scoped config: `<proj>/.zcode/config.json`, `.zcode/{skills,commands,agents,hooks,plans}`, `zcode.json`, `~/.zcode/skills`, `.zcode-plugin/plugin.json`, `.zcode-share/`, seed files `.zcode-bundled-skills-seed.json`, `.zcode-plugin-seed.json` | `packages/services/src/commands/commandsService.ts:50-57,90`, `apps/zcode-cli/packages/adapters/src/skills/roots.ts`, `apps/zcode-cli/packages/bootstrap/src/app/bundled-plugins.ts:36-53`, `apps/zcode-cli/packages/bootstrap/src/app/bundled-skills.ts` |
| R-42 | localStorage / persisted keys `zcode-theme`, `zcode-*` store keys; preload bridges `window.zcode`, `window.zcodeBridge` | `packages/web/index.html`, `packages/ui/src/store/`, `packages/desktop/src/preload/index.ts`, `packages/desktop/src/preload/codingPlanWebview.ts` |
| R-43 | Legacy dirs: `.zcode-runtime` (ignored), `~/.zcode-ui-plugin-dev` | `.gitignore:40,77`, `UI_PLUGIN.md:208` |

### Deep-link / URL schemes

| # | Surface | File path |
|---|---|---|
| R-44 | Primary scheme `zcode://` (`oauth/callback`, `payment/callback`, `workspace/open?path=`, `share/import?code=`, `remote?…`); electron-builder `protocols:[{name: productName, schemes:["zcode"]}]`; runtime `DEEP_LINK_SCHEME="zcode"`; OAuth redirect URIs; Linux `x-scheme-handler/zcode` + `zcode.desktop`. Note: Preview and Prod share the scheme (accepted upstream conflict). | `packages/desktop/electron-builder.config.js:854-859`; `packages/desktop/src/main/desktopDeepLinkUrl.ts:1`; `packages/desktop/src/main/desktopOAuthDeepLink.ts:405,412-436`; `packages/services/src/oauth/providers/zaiProviderConfig.ts:27`, `packages/services/src/oauth/providers/bigmodelProviderConfig.ts:22`, `packages/services/src/oauth/providers/configUtils.ts:7`; `packages/web/src/share/conversationSharePreviewClient.ts:70`; `packages/desktop/src/main/desktopLinuxDeepLinkRegistration.ts:12,64,112-128,238-271`; `docs/desktop/zcode-preview-packaging.md:22,38,55` |
| R-45 | Internal schemes `zcode-sandbox://shell-<id>/plugin-<id>`, `zcode-media:`, `zcode-html:` | `packages/desktop/src/main/pluginSandbox/contract.ts:11,21-28`, `packages/desktop/src/main/pluginSandbox/protocol.ts:19-24,283`; `packages/shared/src/platform.ts:124-125`; `packages/desktop/src/main/localMediaPreviewProtocol.ts:137-143`, `packages/desktop/src/main/index.ts:297`, `packages/desktop/src/main/desktopWindowChrome.ts:53` |

### Auto-update feed and config

| # | Surface (current value) | File path |
|---|---|---|
| R-46 | Updater implementation (electron-updater with server-manifest provider; generic CDN feed retired). Manifest path `/api/v1/releases/electron/manifest` built on `DEFAULT_ZCODE_ENDPOINT_ORIGIN=https://zcode.z.ai` | `packages/desktop/src/main/autoUpdater.ts:1-35,839-870,1683-1716`; `packages/desktop/src/main/manifestUpdateProvider.ts:22,185-250`; `packages/shared/src/zcodeEndpoint.ts:3-4,14` |
| R-47 | Dev-only update overrides (ignored when packaged): env `ZCODE_UPDATE_FEED_URL`, `ZCODE_AUTO_UPDATE_DEV`, `ZCODE_AUTO_UPDATE_DEV_VERSION`; switches `--zcode-update-feed-url`, `--zcode-auto-update-dev[-version]` | `packages/desktop/src/main/autoUpdater.ts:30-35,792-795`; docs `docs/desktop-ci-cd.md:248`, `docs/desktop/auto-update-service-manifest.md:112-149` |
| R-48 | electron-builder publish placeholder `provider: generic, url: http://localhost:8081`, `detectUpdateChannel:false`; dev feed file with `updaterCacheDirName: zcode-dev-updater` | `packages/desktop/electron-builder.config.js:984-991`; `packages/desktop/dev-app-update.yml` |
| R-49 | Build-time update/telemetry endpoint injection: `ZCODE_AUTO_UPDATE`, `ZCODE_ARMS_RUM_ENDPOINT`, `ZCODE_TELEMETRY_REPORT_ENDPOINT` → `__ZCODE_*__` defines | `scripts/build-time-config.mjs:42-54`; `packages/shared/src/env.ts:53-59` |
| R-50 | Release APIs used by CI: `RELEASE_API_URL` default `https://zcode.z.ai/api/v1/releases`, gray API `https://zcode-api.z.ai/api-admin/v1/releases/gray` / `ZCODE_RELEASE_GRAY_API_URL`; server-CLI self-update `ZCODE_SERVER_RELEASE_MANIFEST_URL` | `docs/desktop-ci-cd.md:28,258`; `packages/zcode-server-cli/src/runtime/updatePreparation.ts:59` |
| R-51 | Endpoint/CDN env defaults: `zcode.z.ai`, `cdn-zcode.z.ai`, `ZCODE_REMOTE_ASSET_CDN_BASE_URL=…/zcode/electron/releases/3.14.0`; plugin marketplace `cdn-zcode.z.ai/zcode/official-plugin/marketplace.json`, marketplace id `zcode-plugins-official` | `.env.example:2-22`, `.env.production`, `.env.development`; `packages/shared/src/plugin-marketplaces.ts:47`; `CONTEXT.md:10` |

### `ZCODE_*` env vars (grouped by owning file; canonical registries: `packages/shared/src/runtimeEnv.ts:1-27,61-139`, `packages/shared/src/zcodeEndpoint.ts:78-227`)

Non-env lookalikes excluded from an env rename: `ZCODE_KNOWN_TOOL_NAMES`, `ZCODE_*_ERROR_CODE`, and `__ZCODE_*__` build defines (`packages/desktop/vite.config.ts`, `packages/desktop/tsup.config.ts`, `packages/web/vite.config.ts:97-105`, `packages/zcode-server-cli/tsup.config.ts:20-22`). A raw `ZCODE_[A-Z0-9_]+` token sweep finds 622 distinct tokens including those constants — only the groups below are environment variables.

| # | Vars | Owning file path |
|---|---|---|
| R-52 | `ZCODE_BASE_URL, ZCODE_CDN_BASE_URL, ZCODE_CONVERSATION_SHARE_WEB_URL, ZCODE_REMOTE_ASSET_CDN_BASE_URL, ZCODE_BUILTIN_PROVIDER_CONFIG_FILE, ZCODE_DEPS_BASE_URL, ZCODE_DIST_BASE_URL, ZCODE_PRODUCTION_BASE_URL, ZCODE_TEST_BASE_URL` (+ `ZCODE_ENV` injected by scripts/CI) | `.env.example:2-22`, `.env.production`, `.env.development:2` |
| R-53 | `ZCODE_RUNTIME_ENV, ZCODE_HTTP_PROXY, ZCODE_NO_PROXY, ZCODE_REMOTE_HTTP_PROXY, ZCODE_REMOTE_NO_PROXY, ZCODE_REMOTE_RUNTIME_NETWORK_AUTHORITY, ZCODE_AGENT_CA_CERT, ZCODE_TOOL_ENV_PASSTHROUGH_JSON, ZCODE_DESKTOP_CONTEXT_PROMPT_ENABLED, ZCODE_CUA_PRODUCT_HELPER, ZCODE_CUA_PERMISSION_BROKER_SOCKET, ZCODE_CUA_PERMISSION_BROKER_TOKEN, ZCODE_CUA_PERMISSION_BROKER_REFRESH_MARKER, ZCODE_CUA_PLUGIN_AUTHORITY, ZCODE_CUA_NODE_REPL_HOST, ZCODE_CUA_DEV_MODE, ZCODE_OFFICIAL_ENDPOINT, ZCODE_OFFICIAL_ENDPOINT_TOKEN, ZCODE_MODEL_TELEMETRY_ENABLED, ZCODE_TELEMETRY_DEVICE_MID, ZCODE_TELEMETRY_USER_ID, ZCODE_TELEMETRY_USER_ID_HASH, ZCODE_TELEMETRY_USER_SUBJECT_ID, ZCODE_TELEMETRY_IDENTITY_STATE, ZCODE_TELEMETRY_RUNTIME_SURFACE, ZCODE_TELEMETRY_RUNTIME_DISTRIBUTION` | `packages/shared/src/runtimeEnv.ts:1-27` |
| R-54 | `ZCODE_DATA_BASE_DIR, ZCODE_STORAGE_DIR, ZCODE_SESSION_DB_PATH, ZCODE_SESSION_DB, ZCODE_HOME, ZCODE_WINDOWS_APP_INSTALL_DIR` | `packages/services/src/paths.ts`; `apps/zcode-cli/packages/adapters/src/storage/zcode-storage-root.ts`; `apps/zcode-cli/packages/adapters/src/auth/shared-credentials.ts` |
| R-55 | `ZCODE_MODEL, ZCODE_API_KEY, ZCODE_PERSONAL_PROVIDER_CONFIG_FILE, ZCODE_MAX_TOOL_CONCURRENCY, ZCODE_LOG_DIR, ZCODE_LOG_CONSOLE, ZCODE_MODEL_RETRY_MAX_RETRIES, ZCODE_MODEL_RETRY_BASE_DELAY_MS, ZCODE_MODEL_RETRY_BACKOFF_FACTOR, ZCODE_MODEL_RETRY_MAX_DELAY_MS, ZCODE_BFS_BINARY, ZCODE_RG_BINARY, ZCODE_UGREP_BINARY, ZCODE_NODE_FALLBACK_EXEC_PATH, ZCODE_NODE_FALLBACK_NPM_ROOT, ZCODE_CREDENTIAL_SECRET, ZCODE_DEBUG_NETWORK_CAPTURE, ZCODE_DEBUG_NETWORK_HOST, ZCODE_DEBUG_NETWORK_PORT, ZCODE_DEBUG_NETWORK_CA_DIR, ZCODE_DEBUG_NETWORK_MAX_ENTRIES` | `apps/zcode-cli/packages/adapters/src/config/env-config.adapter.ts`, `apps/zcode-cli/packages/adapters/src/model/`, `apps/zcode-cli/packages/adapters/src/logging/index.ts`, `apps/zcode-cli/packages/debug/server/network-capture.ts` |
| R-56 | `ZCODE_DESKTOP_APPLICATION_NAME, ZCODE_DESKTOP_HOME_DIR, ZCODE_DESKTOP_USER_DATA_DIR, ZCODE_DESKTOP_SESSION_DATA_DIR, ZCODE_DESKTOP_USE_ELECTRON_DEFAULT_USER_DATA, ZCODE_AGENT_SERVER_COMMAND, ZCODE_AGENT_SERVER_ARGS_JSON, ZCODE_AGENT_SERVER_CWD, ZCODE_AGENT_WORKDIR, ZCODE_DISABLE_FIXED_REMOTE_DEBUGGING_PORT, ZCODE_LARK_CLI_BINARY` (plus R-47 update vars) | `packages/desktop/src/main/desktopRuntimeEnv.ts:65-90`; `packages/desktop/src/main/autoUpdater.ts:30-35` |
| R-57 | `ZCODE_PREVIEW_IDENTITY, ZCODE_ENV, ZCODE_PRODUCT_FLAVOR, ZCODE_CUA_HELPER_BUILD_ID, ZCODE_PACKAGED_AGENT_OTEL_ENDPOINT, ZCODE_PACKAGED_AGENT_OTEL_HEADERS, ZCODE_PACKAGED_AGENT_OTEL_SERVICE_NAME, ZCODE_REMOTE_CDN_RELEASE_ROOTS, ZCODE_DESKTOP_AGENT_BYTECODE` | `packages/desktop/scripts/desktop-product-identity.mjs:5`; `packages/desktop/tsup.config.ts:71-72,103-218` |
| R-58 | `ZCODE_ARMS_RUM_ENDPOINT, ZCODE_TELEMETRY_REPORT_ENDPOINT, ZCODE_AUTO_UPDATE, ZCODE_DIST_HOME, ZCODE_DIST_BIN_DIR, ZCODE_SERVER_HOST, ZCODE_SERVER_WORKSPACE, ZCODE_SERVER_AUTH_TOKEN, ZCODE_SERVER_ENTRY, ZCODE_WEB_STATIC_ROOT, ZCODE_BACKEND_PORT, ZCODE_WEB_DIST_DIR` | `scripts/build-time-config.mjs:42-45`; `package.json` scripts; `scripts/zcode-distribution/installer.mjs:7-9` |
| R-59 | `ZCODE_SERVER_ROOT, ZCODE_SERVER_RELEASE_ID, ZCODE_SERVER_RUNTIME_ROOT, ZCODE_SERVER_RELEASE_MANIFEST_URL, ZCODE_SERVER_SKIP_SERVICE_REGISTRATION, ZCODE_LEGACY_CLI_ENTRY, ZCODE_APP_VERSION, ZCODE_NODE_DIST_MIRROR, ZCODE_PROXY_STDIO_IMAGE` | `packages/zcode-server-cli/src/cli.ts`, `packages/zcode-server-cli/src/server-core/core.ts`, `packages/zcode-server-cli/src/runtime/`, `packages/zcode-server-cli/src/packaging/` |
| R-60 | `ZCODE_ENDPOINT_ORIGIN, ZCODE_WEB_REMOTE_CONTROL_URL, ZCODE_WEB_REMOTE_CONTROL_RELAY_WS_URL, ZCODE_BIGMODEL_USAGE_API_KEY, ZCODE_BIGMODEL_USAGE_QUOTA_URL, ZCODE_FEEDBACK_API_BASE, ZCODE_FEEDBACK_NOTIFICATION_TOKEN, ZCODE_OFFICIAL_MCP_DEV_TRUSTED_ORIGINS, ZCODE_INTRANET_PROBE_PATH, ZCODE_INTRANET_PROBE_MARKER, ZCODE_INTRANET_PROBE_TOKEN, ZCODE_RELEASE_GRAY_API_URL, ZCODE_UI_RECOMMENDATIONS_LIVE_CONFIG_URL` | consumers of `packages/shared/src/zcodeEndpoint.ts` in `packages/services/src/`, `packages/desktop/src/main/`, `packages/ui/src/` |
| R-61 | Plugin/tool-child env injected into subprocesses: `ZCODE_PLUGIN_ROOT, ZCODE_PLUGIN_DATA, ZCODE_PLUGIN_ID, ZCODE_PLUGIN_NAME, ZCODE_PROJECT_DIR, ZCODE_SESSION_ID, ZCODE_WORKSPACE_ROOT, ZCODE_SKILL_DIR, ZCODE_NODE_REPL_BROWSER_BROKER_SOCKET, ZCODE_NODE_REPL_BROWSER_BROKER_TOKEN, ZCODE_DWF_CHILD_COMMAND, ZCODE_MAILBOX_ROOT` | `apps/zcode-cli/packages/contracts/src/plugins/index.ts`, `apps/zcode-cli/packages/core/src/hooks/configured-runner-input.ts`, `apps/zcode-cli/packages/bootstrap/src/app/create-app.ts:409`, `apps/zcode-cli/packages/*/.zcode-plugin/plugin.json` |
| R-62 | Build/CI-only: `ZCODE_TARGET_OS, ZCODE_TARGET_ARCH, ZCODE_CI_TMPDIR, ZCODE_CI_SHARED_ROOT, ZCODE_CI_LINUX_CONTAINER_OUT, ZCODE_CI_WINDOWS_SHARED_ROOT, ZCODE_BUILD_PLATFORMS, ZCODE_FEISHU_NOTIFY_TOKEN, ZCODE_FEISHU_NOTIFY_BASE_URL, ZCODE_NATIVE_SEARCH_DEPS_ROOT, ZCODE_NATIVE_SEARCH_ALLOW_PUBLISH, ZCODE_ENABLE_MAC_SIGN, ZCODE_ENABLE_WINDOWS_SIGN, ZCODE_ENABLE_WINDOWS_BROWSER_IMPORT, ZCODE_BOOTSTRAP_WITH_REMOTE, ZCODE_DESKTOP_AGENT_BUILD_MODE, ZCODE_CUA_REPO, ZCODE_CUA_DEV_ROOT, ZCODE_PRE_PUSH_STDIN, ZCODE_PRE_PUSH_BASE, ZCODE_AFFECTED_TEST_BASE, ZCODE_MACOS_RELEASE_APP_PATH, ZCODE_APP_EXECUTABLE_NAME, ZCODE_FORCE_REMOTE_MOCK_CDN, ZCODE_ELECTRON_RUNTIME_MIRROR, ZCODE_REACT_SCAN, ZCODE_STDIO_TAP_LOG_DIR` | `scripts/`, `.gitlab/ci/*.yml`, `packages/desktop/scripts/` |
| R-63 | Test-only: ~90× `ZCODE_E2E_*`, `ZCODE_TEST_RELEASE_TARGET, ZCODE_TEST_RELEASE_ARCH, ZCODE_TEST_CLIENT_CONFIG_PLATFORM, ZCODE_TEST_BACKEND_START_DELAY_MS`, `ZCODE_OFFPEAK_MOCK_*`, `ZCODE_PERF_REPRO`, `ZCODE_FAKE_OFFICIAL_MCP_URL`, `ZCODE_CONVERSATION_SESSION_FORMAL_ADMISSION_ROOT`; Vite-exposed `VITE_ZCODE_BASE_URL, VITE_ZCODE_ENDPOINT_ORIGIN, VITE_ZCODE_E2E_STORE_BRIDGE` | `packages/desktop/wdio.conf.ts`, `packages/desktop/test/e2e/`, `vitest.setup.ts:23-33`, `packages/services/src/session/offPeakMockGateway.ts`, `packages/desktop/vite.config.ts:232-240`, `packages/web/vite.config.ts:103-105`, `packages/web-share/vite.config.ts:75-76` |

### i18n (inventory only — no copy changed)

| # | Surface | File path |
|---|---|---|
| R-64 | App UI locales: only `en-US` (8,459 lines) and `zh-CN` (8,013 lines); i18n infra alongside | `packages/ui/src/i18n/locales/en-US.ts`, `packages/ui/src/i18n/locales/zh-CN.ts`, `packages/ui/src/i18n/{index.ts,IntlProvider.tsx,LocaleSwitcher.tsx}` |
| R-65 | CLI locales: `en-US`, `zh-CN`; `SUPPORTED_LOCALES=["en-US","zh-CN"]`, default `en-US` | `apps/zcode-cli/packages/i18n/src/locales/{en-US,zh-CN}.ts`, `apps/zcode-cli/packages/i18n/src/locale.ts:3-4,17,46-47` |
| R-66 | Electron/Chromium locale config `electronLanguages: ["en-US","zh-CN"]`, mac `["en","zh_CN"]`; desktop menu locale messages; web auth/share locales; updater `releaseNotesByLocale` | `packages/desktop/electron-builder.config.js` (~L605/865), `packages/shared/src` (`desktopMenuMessageIds`, `DEFAULT_LOCALE`), `packages/web/src/auth/webAuthLocale.ts`, `packages/web-share/src/main.tsx:61`, `packages/desktop/src/main/autoUpdater.ts:78-99` |

### Other rename surfaces (easy to miss)

| # | Surface | File path |
|---|---|---|
| R-67 | Internal identifiers: `@zcode/*` imports in virtually every source file; wire methods `zcode.dev/*`; meta keys `com.zcode/official-mcp-auth`, `_meta.zcode.*`; headers `x-zcode-*`/`X-ZCode-*`; error codes `ZCODE_*`; credential key `zcodejwttoken`; service names `com.zhipu.zcode.server.*` | `packages/shared/src/zcode-protocol/`, `packages/shared/src/zcode-protocol-v4/`, `packages/services/src/zcode-agent/` (`ZCodeAgentService`, `IZCodeTaskService`), `packages/zcode-server-cli/scripts/verify-remote-ssh.mjs:181` |
| R-68 | Plugin system: `.zcode-plugin/plugin.json` manifests in all CLI plugin packages; official plugin ids `zcode-guide`, `zcode-cua`, `zcode-site`, `browser-use@zcode-plugins-official`; marketplace id (R-51) | `apps/zcode-cli/packages/*-plugin/.zcode-plugin/plugin.json`, `CONTEXT.md:10` |
| R-69 | Process names: CLI process title `zcode-cli`; renderer/process titles from R-08 | `apps/zcode-cli/docs/design/v2/commands.md:5,7`, `packages/desktop/src/preload/index.ts:224` |
| R-70 | CI/release naming: GitLab job names/vars, publish + Feishu notify scripts, artifact paths `@electron/dev`, `@electron-preview` | `.gitlab/ci/*.yml`, `scripts/publish-release.sh`, `scripts/notify-feishu*`, `docs/desktop-ci-cd.md:75-95` |
| R-71 | Third-party notices carrying "Modified by ZCode:" markers; upstream copyright | `THIRD-PARTY-NOTICES.md:2431-2445`, `third-party/README.md:7,68`, `third-party/inventory.json`, `LICENSE:190` ("Copyright 2026 Z.AI Co., Ltd" — keep legally as attribution) |

**Rename count: R-01…R-71 = 71 surfaces.**

---

## 0.1.2 GLM / Z.ai touchpoint inventory

There is currently **no NVIDIA/NIM template anywhere** in the builtin config. Z-01 and Z-02 below are the complete contents summary of the shipped provider config; Z-03 onward cover code.

### Provider-defaults

| # | Touchpoint | Mark | Reason |
|---|---|---|---|
| Z-01 | Builtin provider config file `config/provider/zcode-builtin.json` (8,471 lines, `schemaVersion: 1`, `revision: 43` at L2-3). Sections: `config.providerConfigRules.templateRules` L6-1050 (34 templates), `config.providerConfigRules.providerRules` L1051-1267 (10 account providers), `config.modelConfigRules.modelRules` L1269-2829 (83), `modelApiRules` L2830-3643 (73), `providerSiteRules` L3644-4741 (58), `templateModelRules` L4742-8255 (316), `builtinProviderModelRules` L8256-8471 (30). **Every template carries exactly:** `templateId`, `templateNameMap{zh-CN,en-US}`, `config{ access{type, apiKeyManagementUrl}, api{type, baseUrl}, builtinModelIds[], logo{type:"builtin", key} }`. **No default marker exists in the file** (no `defaultModelSelection`/`isDefault`) — the default is imposed by code (Z-07/Z-08). Full template list in the table after this one. | REPLACE-WITH-NIM (for the Z.ai/BigModel entries; KEEP third-party templates) | This file is the provider catalogue the fork must re-default to NIM |
| Z-02 | The 10 account `providerRules` in `config/provider/zcode-builtin.json:1051-1267`. Fields per rule: `providerId`, `providerName`, `config{ group, builtinModelIds, [visibility], access{type:"zhipu-account", mode, accountType}, api{type:"anthropic-messages", baseUrl}, logo }`. Entries: `account:zai-individual-coding-plan` L1053 (`api.z.ai/api/anthropic` L1065), `account:zai-team-coding-plan` L1074, `account:zai-start-plan` L1095 (`zcode.z.ai/api/v1/zcode-plan/anthropic` L1107), `account:bigmodel-individual-coding-plan` L1116 (`open.bigmodel.cn/api/anthropic` L1128), `account:bigmodel-team-coding-plan` L1137, `account:bigmodel-start-plan` L1158 (also routes via `zcode.z.ai` L1170), `account:zai-offpeak-idle-plan` (hidden) L1179 (`zcode.z.ai/api/v1/off-peak/anthropic` L1192), `account:bigmodel-offpeak-idle-plan` (hidden) L1200, `account:zai-highspeed-card` (hidden) L1222 (`zcode.z.ai/api/v1/highspeed/anthropic` L1236), `account:bigmodel-highspeed-card` (hidden) L1244. Supporting schema: `zhipu-account` access type with `accountType: zai\|bigmodel`. | STRIP (all 10) | Every account provider requires a Z.ai/BigModel account, entitlement, or Z.ai gateway quota; NIM needs only `api-key` |
| Z-03 | Test twin of the builtin config: identical templates/providerRules/modelRules, only `providerSiteRules` differs (70 vs 58 entries) | `config/provider/zcode-builtin.test.json` | KEEP as fixture, strip in lockstep with prod |
| Z-04 | Build-time selection of prod vs test builtin file; writes embedded `zcode-builtin.json` | `scripts/builtin-provider-config.mjs:44,70` | KEEP — vendor-neutral delivery plumbing |
| Z-05 | Runtime remote download of builtin config: fetches `{endpointOrigin}/api/v1/client/configs`, reads `data.configs.builtin_provider_config_json` download URL (CDN form `https://cdn-zcode.z.ai/zcode/config/zcode-builtin.json`); remote-sync source files alongside | `packages/provider-node/src/zcode-builtin-download.ts:55,59`, `packages/provider-node/src/zcode-builtin-remote-synchronizer.ts`, `packages/provider-node/src/endpoint-scoped-zcode-builtin-source.ts`; CDN documented `docs/working-memory/provider-refactor/research/builtin-online-release-review-2026-09-11.md:19` | STRIP the remote-sync source (KEEP local loading mechanics) — a NIM fork must not let Z.ai replace its provider list at runtime |
| Z-06 | Schema coupling for account providers: `bigmodel-family`, modes enum, `zhipu-coding-plan-api-key`, `zhipu-account` (`accountType: zai\|bigmodel`); entitlement gate admits `zhipu-account` providers only when `entitled === true` | `packages/provider/src/config/provider-data-schema.ts:12,14,34,43-47`; `packages/provider/src/resolver.ts:271,383` | STRIP — the `zhipu-account` access type is the coupling mechanism |

#### Z-01 detail — all 34 templates in `config/provider/zcode-builtin.json`

| # | Line | templateId | access.type | api.type | baseUrl | Mark |
|---|---|---|---|---|---|---|
| 1 | 7 | `zai-api` "Z.ai Coding Plan" (key-mgmt `https://z.ai/manage-apikey/apikey-list` L16; models GLM-5.3, GLM-5.3-Flash) | `zhipu-coding-plan-api-key` | anthropic-messages | `https://api.z.ai/api/anthropic` L20 | REPLACE-WITH-NIM — headline plan slot NIM should occupy |
| 2 | 29 | `zai-standard-api` "Z.ai API" (25 GLM/codegeex/charglm/emohaa models L44-70) | `api-key` | openai-chat-completions | `https://api.z.ai/api/paas/v4` L42 | STRIP — Z.ai-proprietary endpoint |
| 3 | 77 | `bigmodel-api` "BigModel Coding Plan" (`https://bigmodel.cn/coding-plan/personal/overview` L86; GLM-5.3/Flash) | `zhipu-coding-plan-api-key` | anthropic-messages | `https://open.bigmodel.cn/api/anthropic` L90 | STRIP — Zhipu billing, not portable |
| 4 | 99 | `bigmodel-standard-api` "BigModel API" (24 GLM models L114-139) | `api-key` | openai-chat-completions | `https://open.bigmodel.cn/api/paas/v4` L112 | STRIP — same as #2 for BigModel |
| 5 | 146 | `moonshot-kimi` Kimi (8 kimi/k3) | `api-key` | anthropic-messages | `https://api.moonshot.cn/anthropic` | KEEP — third-party |
| 6 | 177 | `kimi-code-cn` (6) | `api-key` | openai-chat-completions | `https://api.kimi.com/coding/v1` | KEEP |
| 7 | 206 | `kimi-code-intl` (6) | `api-key` | openai-chat-completions | `https://api.kimi.ai/coding/v1` | KEEP |
| 8 | 235 | `minimax` MiniMax (6 MiniMax-M*) | `api-key` | anthropic-messages | `https://api.minimaxi.com/anthropic` | KEEP |
| 9 | 264 | `minimax-m-plan-cn` (2) | `api-key` | anthropic-messages | `https://api.minimax.cn/anthropic` | KEEP |
| 10 | 286 | `deepseek` DeepSeek (deepseek-flash, deepseek-v4-pro) | `api-key` | anthropic-messages | `https://api.deepseek.com/anthropic` | KEEP |
| 11 | 308 | `qwen-alibaba-model-studio-cn` (13 qwen3.x) | `api-key` | anthropic-messages | `https://dashscope.aliyuncs.com/apps/anthropic` | KEEP |
| 12 | 344 | `qwen-alibaba-model-studio-intl` (14) | `api-key` | openai-chat-completions | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` | KEEP |
| 13 | 381 | `qwen-coding-plan-cn` (qwen3.7-plus) | `api-key` | openai-chat-completions | `https://coding.dashscope.aliyuncs.com/v1` | KEEP (another vendor's plan, unrelated to Zhipu) |
| 14 | 403 | `qwen-token-plan-team-cn` (2) | `api-key` | openai-chat-completions | `https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1` | KEEP |
| 15 | 425 | `xiaomi-mimo` (4 mimo) | `api-key` | anthropic-messages | `https://api.xiaomimimo.com/anthropic` | KEEP |
| 16 | 447 | `xiaomi-mimo-token-plan` (2) | `api-key` | anthropic-messages | `https://token-plan-cn.xiaomimimo.com/anthropic` | KEEP |
| 17 | 469 | `tencent-tokenhub-cn` (hy3, hy4-preview) | `api-key` | openai-chat-completions | `https://tokenhub.tencentmaas.com/v1` | KEEP |
| 18 | 491 | `tencent-tokenhub-intl` (2) | `api-key` | openai-chat-completions | `https://tokenhub-intl.tencentmaas.com/v1` | KEEP |
| 19 | 513 | `volcengine-ark` (4 doubao-seed) | `api-key` | anthropic-messages | `https://ark.cn-beijing.volces.com/api/compatible` | KEEP |
| 20 | 540 | `volcengine-coding-plan` (2) | `api-key` | anthropic-messages | `https://ark.cn-beijing.volces.com/api/coding` | KEEP |
| 21 | 562 | `volcengine-agent-plan` (2) | `api-key` | anthropic-messages | `https://ark.cn-beijing.volces.com/api/plan` | KEEP |
| 22 | 584 | `stepfun` StepFun API (step-5-preview, step-3.7-flash) | `api-key` | anthropic-messages | `https://api.stepfun.com` | KEEP |
| 23 | 606 | `stepfun-step-plan` (2) | `api-key` | anthropic-messages | `https://api.stepfun.com/step_plan` | KEEP |
| 24 | 628 | `openai` OpenAI (12 gpt-*) | `api-key` | openai-responses | `https://api.openai.com/v1` | KEEP — protocol shape NIM reuses |
| 25 | 663 | `anthropic` Anthropic (8 claude-*) | `api-key` | anthropic-messages | `https://api.anthropic.com/v1` | KEEP |
| 26 | 694 | `xai` xAI (4 grok-*) | `api-key` | openai-responses | `https://api.x.ai/v1` | KEEP |
| 27 | 716 | `siliconflow-cn` (`zai-org/GLM-5.3`, DeepSeek, Kimi L731-735) | `api-key` | openai-chat-completions | `https://api.siliconflow.cn/v1` | KEEP — optionally drop the GLM row |
| 28 | 742 | `openrouter` OpenRouter (70 models incl. `z-ai/glm-*` L757-828) | `api-key` | anthropic-messages | `https://openrouter.ai/api` | KEEP — GLM rows are catalogue entries |
| 29 | 835 | `opencode-go-responses` (4) | `api-key` | openai-responses | `https://opencode.ai/zen/go/v1` | KEEP |
| 30 | 857 | `opencode-go-messages` (9) | `api-key` | anthropic-messages | `https://opencode.ai/zen/go/v1` | KEEP |
| 31 | 889 | `opencode-go-chat` (19 incl. glm-5.x) | `api-key` | openai-chat-completions | `https://opencode.ai/zen/go/v1` | KEEP |
| 32 | 931 | `opencode-zen-responses` (17) | `api-key` | openai-responses | `https://opencode.ai/zen/v1` | KEEP |
| 33 | 971 | `opencode-zen-messages` (18) | `api-key` | anthropic-messages | `https://opencode.ai/zen/v1` | KEEP |
| 34 | 1012 | `opencode-zen-chat` (15 incl. `nemotron-3-ultra-free` L1036, `nemotron-3.5-lightning-free` L1042) | `api-key` | openai-chat-completions | `https://opencode.ai/zen/v1` | KEEP — closest existing NIM-adjacent entry (NVIDIA Nemotron via OpenCode) |

### Auth / onboarding

| # | Touchpoint | Mark | Reason |
|---|---|---|---|
| Z-07 | First-launch sign-in gate: `shouldOpenLoginEntry = !providerFamilyDomain \|\| (!user && !hasUsableProvider)`; wired in Root, workspace/session restore blocked while login entry open (`canRestoreWorkspaceSession` false), startup reasons incl. `session-expired`, `logout-provider-required`, renders `<WelcomeScreen>` | `packages/ui/src/root/useProviderAvailabilityLoginEntryGuard.ts:57,59`; `packages/ui/src/Root.tsx:133,290-293,587-627,685,719,1533` | STRIP the startup gate — with NIM as API-key default there is no account to require before first use |
| Z-08 | Welcome/login screen: Z.ai sorted first (`getProviderPriority`, comment L558 "Windows 登录入口里 z.ai 入口需要固定排在最上面"), Global/CN region tags, ZCode logo lockup | `packages/ui/src/WelcomeScreen.tsx:3-6,36-48,455,506-517,530-539,556-568` | REPLACE-WITH-NIM — OAuth buttons become a single NIM API-key form (or nothing) |
| Z-09 | API-key fallback form hardwired to two choices `zai`\|`bigmodel` → templates `zai-api`/`bigmodel-api`; default BigModel for `zh-CN`, Z.ai otherwise; "skip" writes `providerFamilyDomain` | `packages/ui/src/login/LoginApiKeyForm.tsx:48-148`; `packages/ui/src/login/LoginApiKeyForm.helpers.ts:10-22,35-47` (default at :12-14) | REPLACE-WITH-NIM — choices become NIM (+ generic custom); skip must not record a Zhipu family domain. **This is where the code-level default provider lives.** |
| Z-10 | OAuth session machinery (hooks, attempt guard, cached-session restore, login-entry store state) | `packages/ui/src/hooks/useOAuth.ts:73`, `packages/ui/src/root/useRootOAuthEffects.ts`, `packages/ui/src/root/oauthLoginAttemptGuard.ts`, `packages/ui/src/root/oauthCachedSessionRestore.ts`, `packages/ui/src/store/index.ts:49-67,189-197,414-439` | STRIP — exists only for Z.ai/BigModel accounts |
| Z-11 | Z.ai OAuth provider config: authorize `https://chat.z.ai/api/oauth/authorize`, token `https://zcode.z.ai/api/v1/oauth/token`, userinfo `https://chat.z.ai/api/oauth/userinfo`, business login `https://api.z.ai/api/auth/z/login`, hardcoded client_id `client_P8X5CMWmlaRO9gyO-KSqtg` (L26; client id only, not a secret) | `packages/services/src/oauth/providers/zaiProviderConfig.ts:15-28` | STRIP — all endpoints Z.ai-only |
| Z-12 | BigModel OAuth provider config: authorize `https://bigmodel.cn/login`, token via `zcode.z.ai`, userinfo `/api/biz/customer/getCustomerInfo`, `appId:"zcode"` | `packages/services/src/oauth/providers/bigmodelProviderConfig.ts:10,13-23` | STRIP — BigModel-only; note even its token exchange transits Z.ai infra |
| Z-13 | OAuth service layer + web Z.ai OAuth config defaulting to `https://chat.z.ai`; CLI login with same endpoints | `packages/services/src/oauth/oauthService.ts`, `packages/services/src/oauth/oauthProviderLogout.ts`, `packages/services/src/oauth/repo/oauthCredentialRepo.ts`, `packages/services/src/oauth/providers/zaiProviderAdapter.ts:268`, `packages/web/src/auth/webZaiOAuthConfig.ts:30`, `apps/zcode-cli/packages/bootstrap/src/auth-login.ts` | STRIP — whole layer is account-login for Z.ai/BigModel |
| Z-14 | Occupation onboarding (3-step wizard, separate from sign-in): occupation/mode/preference, local-record gate, anonymous record claimed on login | `packages/ui/src/onboarding/OccupationOnboarding.tsx:35,77-89,217`, `packages/ui/src/onboarding/useOnboardingTrigger.ts:22-27,67-74`, `packages/ui/src/onboarding/OnboardingDialog.tsx`, `packages/ui/src/onboarding/OnboardingAgentsFileStep.tsx`, `packages/services/src/onboarding/onboardingRecordService.ts`, `packages/shared/src/onboardingRecord.ts`; mounted `packages/ui/src/Root.tsx:1591` | KEEP — vendor-neutral; only its telemetry (Z-17) and login-claim step (`useOnboardingTrigger.ts:67-73`) go with OAuth |
| Z-15 | **Coding-Plan gateway rerouting (hidden redirect):** static map rewrites `https://open.bigmodel.cn:443/api/anthropic/v1/messages` → `/api/v1/ultra/anthropic/v1/messages` and `https://api.z.ai:443/api/anthropic/v1/messages` → `/api/v1/ultra-zai/anthropic/v1/messages`, resolved against the ZCode endpoint origin (`zcode.z.ai`) | `apps/zcode-cli/packages/adapters/src/model/official-coding-plan-gateway.ts:8-11,33`; wired `apps/zcode-cli/packages/adapters/src/model/endpoint-routing-edition/index.ts:5-9`; test `apps/zcode-cli/packages/adapters/tests/official-coding-plan-gateway.test.ts:9,17` | STRIP — most important single find: even "direct" Coding Plan API-key prompts transit `zcode.z.ai`; NIM traffic must go direct |

### Network-calls

| # | Touchpoint | Mark | Reason |
|---|---|---|---|
| Z-16 | Central endpoint definitions: `https://zcode.z.ai` (L3,4), `https://bigmodel.cn` (L6,7), `https://chat.z.ai` (L8,9), `https://api.z.ai` (L10,11), OAuth client id (L12,13), relay `wss://zcode.z.ai/api/v1/remote/ws2` (L14); derived `/api/v1`, `/remote/v3\|v4`, `/cn/share/callback`, `/api/v1/zcode-plan[/anthropic]`, `/api/v1/zcode-plan/billing/current`, `/api/v1/zcode-plan/billing/balance` (L374-385); BigModel resolvers L252-269, Z.ai OAuth L281-295, Z.ai business L297-311. Same domains in env files (+ `https://cdn-zcode.z.ai`, share URL, remote-asset CDN). | `packages/shared/src/zcodeEndpoint.ts:3-14,252-311,374-385`; `.env.example:2-14`, `.env.production:3-5`, `.env.development:2-4`; `packages/shared/src/plugin-marketplaces.ts:47`; `packages/android/app/build.gradle.kts:24,30`, `packages/android/app/src/main/res/values/strings.xml:6` | STRIP/REPLACE — master switch file; delete Z.ai/BigModel resolvers, keep only generic plumbing (share/remote to own host, if kept) |
| Z-17 | Telemetry: event payloads (event_id, user_id, device_mid, marketing_params, talk/message ids) POSTed to `ZCODE_TELEMETRY_REPORT_ENDPOINT` rewritten onto the ZCode endpoint — concrete `https://zcode.z.ai/api/v1/event/report`. Endpoint is build-time injected (`__ZCODE_TELEMETRY_REPORT_ENDPOINT__`), empty = disabled. | `packages/services/src/telemetry/telemetryCore.ts:21,418-419,432-462`; endpoint in `vitest.config.ts:9`, `docs/monitoring/business-monitoring.md:195`; injection `packages/shared/src/env.ts:53-59`, `scripts/build-time-config.mjs:42-43,52-53` | STRIP the Z.ai destination (KEEP the empty=disabled kill-switch design; NIM fork points at its own collector or none) |
| Z-18 | ARMS RUM (Alibaba APM) in desktop/preload + packaged agent OTEL endpoint injection | `packages/desktop/src/shared/armsRumShared.ts:39-42`, `packages/desktop/src/shared/armsBrowserInit.ts:32`, `packages/desktop/src/shared/armsRumBridgeForward.ts:3-4`, `packages/desktop/src/preload/index.ts:12`, `packages/desktop/tsup.config.ts:100-158,218-219` | STRIP — third-party Alibaba crash/perf telemetry; endpoint only exists in CI secrets |
| Z-19 | Coding-Plan funnel/purchase telemetry; provider labels `z.ai`/`bigmodel` in app telemetry | `packages/ui/src/lib/codingPlanFunnelTelemetry.ts:17,83`, `packages/ui/src/onboarding/useOnboardingTelemetry.ts`, `packages/ui/src/lib/appTelemetry.ts:17-32,40-72` | STRIP — analytics exist to sell Coding Plans |
| Z-20 | Cloud config / feature-flag plane `GET {zcode.z.ai}/api/v1/client/configs`: consumers are builtin-config download (Z-05), Coding Plan products/pricing, off-peak grey release, **force-update gate that can block app startup**, feature rollouts, desktop context-prompt rollout | `packages/services/src/client-config/clientConfigService.ts:70-71`, `packages/provider-node/src/zcode-builtin-download.ts:55`, `packages/services/src/coding-plan-subscription/bigmodelCodingPlanSubscriptionProvider.ts:97,264-274,412-476,807-820`, `packages/desktop/src/main/forceUpdateGuard.ts:13,68`, `packages/desktop/src/main/singleFeatureRollout.ts:6,42`, `packages/desktop/src/main/desktopContextPromptRollout.ts:93`, `packages/desktop/src/main/index.ts:888` | STRIP — remote config/force-update control by Z.ai over a fork is disqualifying; bundle config locally |
| Z-21 | Idle-time (Off-Peak) tasks: hidden providers (Z-02 L1179-1219); gate `client/configs.offPeak.enable_offpeak_task` + builtin models; credentials require ZCode JWT + Coding Plan API key (Start Plan rejected); server client calls `{origin}/api/v1/off-peak…` | `packages/services/src/coding-plan-subscription/bigmodelCodingPlanSubscriptionProvider.ts:415-428,1564-1580`, `packages/services/src/session/offPeakRuntimeModel.ts:28-45,92-119,268-285`, `packages/services/src/session/offPeakServerClient.ts:165`, `packages/services/src/session/offPeakTaskService.ts`, repo `packages/services/src/session/offPeakTaskRepo.ts` (offPeak* files in that dir), UI copy `packages/ui/src/i18n/locales/en-US.ts:632-635,7890-7974` | STRIP — feature only monetises off-peak GLM capacity; no NIM equivalent |
| Z-22 | Highspeed card: draw + accelerated inference via `/api/v1/highspeed/` gateway, dual JWT (ZCode JWT + Coding Plan JWT) | `packages/services/src/highspeed/highspeedCardService.ts:28-29,69-87,174`, `packages/services/src/highspeed/highspeedHttpTransport.ts`, UI `packages/ui/src/highspeed/` (~15 files) | STRIP — paid GLM speed card |
| Z-23 | Start Plan free quota, balance, recommendations; billing URLs from endpoint file | `packages/services/src/model-provider/zaiStartPlanBilling.ts`, `packages/ui/src/hooks/useStartPlanRecommendation.ts`, `packages/ui/src/chat-input-toolbar/StartPlanContextBalance.tsx`, `packages/shared/src/zcodeEndpoint.ts:383-384` | STRIP — Z.ai trial-quota programme |
| Z-24 | Coding Plan purchase/usage/quota-reset commerce surface: subscription providers (`/api/biz` prefix, `/api/monitor/usage/quota/limit`), purchase WebView, usage panels | `packages/services/src/coding-plan-subscription/bigmodelCodingPlanSubscriptionProvider.ts:95`, `packages/services/src/coding-plan-subscription/zaiCodingPlanSubscriptionProvider.ts:19,25`, `packages/services/src/usage-stats/providers/bigmodelUsageQuotaProvider.ts:73`, `packages/ui/src/settings/CodingPlanEmbeddedWebviewDialog.tsx`, `packages/desktop/src/preload/codingPlanWebview.ts:65,118`, `packages/ui/src/settings/usage-stats/CodingPlanUsagePanel.tsx`, `packages/ui/src/settings/usage-stats/CodingPlanUsageRemainingPanel.tsx` | STRIP — entire commerce surface |
| Z-25 | Official server MCP gated on Coding Plan ("This account has no Coding Plan. Purchase or configure a Coding Plan to use this MCP server.") + MCP quota provider | `packages/ui/src/i18n/locales/en-US.ts:3861`, `packages/services/src/official-mcp/officialMcpCredentials.ts`, `packages/services/src/usage-stats/providers/zcodeMcpQuotaProvider.ts:68,77` | STRIP — MCP access sold via Coding Plan |
| Z-26 | Account-provider model admission: account providers usable only when entitled (also Z-06) | `packages/provider/src/resolver.ts:242,271` | STRIP with Z-02 |
| Z-27 | Repo Wiki: **no implementation exists in this checkout.** Only a dangling UI prop, a capability-map mention, and working-memory docs; historically (per those docs) Wiki generation ran through the user's selected model provider, not a dedicated Z.ai Wiki API. | `packages/ui/src/project-sidebar/contract.ts:144-145` (`onOpenRepoWiki?`, `repoWikiActive?`), `apps/dev-docs/src/data/productCapabilityMap.ts:217`, `docs/working-memory/provider-refactor/steps/todo-34-*`, `docs/working-memory/provider-refactor/steps/todo-94-wiki-model-output-limit.md` | STRIP the dead prop — nothing to replace; if Wiki returns it should call NIM like any model task. (Explicitly flagged: the audit brief assumed a Wiki cloud call exists; it does not.) |
| Z-28 | Legacy migration rewrites BigModel Coding Plan URLs to `https://open.bigmodel.cn/api/anthropic`; legacy reader also carries naming in `packages/shared/src/model-provider-family.ts:35` (`https://z.ai/manage-apikey/subscription`) | `packages/services/src/model-provider/legacyZCodeConfigProviderReader.ts:64,66-73,438-503`, `packages/shared/src/model-provider-family.ts:35` | STRIP with legacy migration |
| Z-29 | Z.ai-hosted share/rewards surfaces: share fallback `https://zcode.z.ai/cn/share`, share-landing download URL `https://zcode.z.ai`, rewards pages on `zcode.z.ai` | `packages/services/src/conversation-share/conversationShareService.ts:714`, `packages/web/src/share/ConversationShareLandingPage.tsx:106`, `packages/shared/src/rewardsEmbedded.ts:24,54` | STRIP/REPLACE — repoint to fork-owned host or remove |
| Z-30 | Zhipu Feishu feedback form + community links in default config | `config/default.json:2,5` | STRIP — points users at Zhipu's Feishu tenant |
| Z-31 | Dev/test fixtures hardcoding Z.ai/BigModel endpoints (not runtime) | `scripts/multimodal-tool-result-p0.mjs:8`, `apps/zcode-cli/test-model.mjs:5`, `packages/desktop/wdio.conf.ts:418-424,1477` | KEEP as fixtures or delete with their features |

### Branding / copy

| # | Touchpoint | Mark | Reason |
|---|---|---|---|
| Z-32 | Login copy: "Welcome to ZCode", "Connect to Z.ai", "Connect to BigModel", Global/CN region tags, API-key provider names (zh-CN mirrors) | `packages/ui/src/i18n/locales/en-US.ts:1487-1525`, `packages/ui/src/i18n/locales/zh-CN.ts` (same key range) | REPLACE-WITH-NIM — login copy becomes NIM key entry; Z.ai/BigModel strings must go |
| Z-33 | Coding Plan copy throughout locales: purchase/upgrade, "The GLM Coding Plan is strictly limited to use by the subscriber…", usage banners, off-peak copy, Start Plan copy | `packages/ui/src/i18n/locales/en-US.ts:4073-4092,4171-4322,4545,4733-4738,7890-7974`, `packages/ui/src/i18n/locales/zh-CN.ts` (mirrors) | STRIP — copy dies with Z-21…Z-25 |
| Z-34 | Provider icons for `account:zai-offpeak-idle-plan`, `account:bigmodel-offpeak-idle-plan` and OAuth provider icons; Welcome logo lockup + About logo (name-coupled, not Z.ai-specific) | `packages/ui/src/assets/provider-icons/model-provider-logo-sources.json:39,52`, `packages/ui/src/lib/oauthProviderIcon.tsx`, `packages/ui/src/WelcomeScreen.tsx:506-517`, `packages/ui/src/components/ui/ZCodeAboutLogo.tsx` | STRIP the zai/bigmodel icons with their providers; REPLACE-WITH-NIM add an NVIDIA icon; logos follow the Riddi rename |
| Z-35 | Explicitly-Zhipu service identifier prefix `com.zhipu.zcode.server.*` (the only `com.zhipu.*` branded identifier found) | `packages/zcode-server-cli/scripts/verify-remote-ssh.mjs:181` | STRIP/rename if the fork ships its own server |

**Z.ai touchpoint count: Z-01…Z-35 = 35 touchpoints** (Z-01/Z-02 expand to the full 34-template + 10-account-provider lists above).

Load-bearing summary: (1) the default path is Zhipu — no default in the JSON; code defaults to BigModel (zh) / Z.ai (en) at `LoginApiKeyForm.helpers.ts:12-14`, Z.ai first at `WelcomeScreen.tsx:556-568`, and first launch is blocked until an account/API key exists (Z-07). (2) Traffic rerouting via Z-15 and the gateway baseUrls in Z-02. (3) Remote control plane via Z-20/Z-05. (4) Telemetry via Z-17/Z-18. (5) Repo Wiki does not exist (Z-27).

---

## 0.1.3 Provider layer and NIM readiness

### How a provider template actually works (verified against code)

| # | Fact | Evidence (file:line) |
|---|---|---|
| P-01 | Canonical template sources: production and test builtin files; `schemaVersion: 1`, prod `revision: 43` | `config/provider/zcode-builtin.json:1-6` (`templateRules` from L6, `modelConfigRules` from L1268); `config/provider/zcode-builtin.test.json` |
| P-02 | Build-time selection does NOT consult the env override: `loadBuiltinProviderConfig()` picks prod vs test by `ZCODE_ENV`, validated via `decodeZCodeBuiltinRelease`; content embedded at build time as `__ZCODE_BUILTIN_PROVIDER_CONFIG_JSON__` | `scripts/builtin-provider-config.mjs:42-56`; `packages/zcode-server-cli/tsup.config.ts:13-22` |
| P-03 | Runtime loading: strict release schema `{schemaVersion:1, revision:int≥0, config:{providerConfigRules, modelConfigRules}}`; `templateRules` → `ProviderTemplateMap`, `providerRules` → `ProviderConfigMap`; snapshot exposes `providers`, `providerTemplates`, `models`; Bundled vs Active/LKG selection, newest revision wins, file watching | `packages/provider-node/src/zcode-builtin-release.ts:25-56`; `packages/provider/src/config/schema.ts:44-53`; `packages/provider-node/src/zcode-builtin-provider-config-source.ts:49-65,103-115,198-200,231-246` |
| P-04 | Service wiring: source → `ProviderConfigService`; snapshot exposes `zcodeBuiltinProviderTemplates`; `createPersonalProvider({templateId})` looks the template up (throws if missing); at resolve time the template is an overlay baseline (`template.overlay(personal)`) and never enters the Registry itself | `packages/provider-node/src/provider-config-runtime.ts:55-65,86-89`; `packages/provider/src/config-service.ts:112-128,223-229`; `packages/provider/src/resolver.ts:191-207`; `packages/provider/src/config/provider-config.ts:275,309` |
| P-05 | **`ZCODE_BUILTIN_PROVIDER_CONFIG_FILE` override: EXISTS, runtime-only.** Constant in provider-node runtime paths; documented in README and `.env.example`. Desktop: explicit env path returned verbatim, else packaged `resources/config/provider/zcode-builtin.json`, else dev `../../config/provider/{zcode-builtin\|zcode-builtin.test}.json`; injected into host. Remote server Core: env path used directly (skips materialising embedded JSON), throws if neither exists. Standalone CLI: if builtin+personal env paths both set, used as-is; if only builtin set it is the bundled source, read once, downstream env rewritten to the Active cache path; fallback SEA asset `zcode-provider/zcode-builtin.json` or `provider/zcode-builtin.json` next to entrypoint / repo `config/provider/zcode-builtin.json`. Caveat: override file must pass the strict release schema (schemaVersion 1, unique template/provider IDs); a higher `revision` wins over a stale Active cache. | `packages/provider-node/src/runtime-paths.ts:1`; `README.md:144`; `.env.example:17`; `packages/desktop/src/main/desktopProviderConfig.ts:11-21`; `packages/desktop/src/main/index.ts:1971`; `packages/zcode-server-cli/src/server-core/core.ts:37-53`; `apps/zcode-cli/packages/cli/src/provider-runtime-env.ts:18,58-102,137-155`; schema `packages/provider/src/config/rule-data-schema.ts:124-143` |
| P-06 | **Protocols a custom provider can speak: exactly 3.** `providerApiTypeDataSchema = z.enum(["anthropic-messages", "openai-chat-completions", "openai-responses"])`; UI offers the same 3 (`/v1/messages`, `/chat/completions`, `/responses`); execution maps `anthropic-messages`→Anthropic SDK, `openai-responses`→OpenAI SDK, `openai-chat-completions`→`openai-compatible`. "OpenAI-compatible" = `openai-chat-completions` (what NIM uses); "Anthropic" = `anthropic-messages`. Nothing else exists. | `packages/provider/src/config/provider-data-schema.ts:4-8`; `packages/ui/src/settings/model-provider-section/ProviderApiFormatSelect.tsx:16-26`; `apps/zcode-cli/packages/adapters/src/model/model-execution.ts:414-422` |
| P-07 | **Where context limit is set: per-model data, no code constant.** Complete schema: `contextWindow: z.number().int().positive()` is *required*; sparse/overlay schema: optional. No `.default()` anywhere. Values live in `config.modelConfigRules` in 5 rule layers (`modelRules` regex on modelId, `modelApiRules` +apiType, `providerSiteRules` +baseUrl, `templateModelRules` templateId+modelId, `builtinProviderModelRules` providerId+modelId); personal exact/manual rules overlay last. A model whose resolved config fails complete validation (e.g. missing `contextWindow`) is `executable:false` and excluded from the registry — there is **no fallback fill-in**. UI commit fails `invalid/contextWindow` if neither typed nor inherited value exists. | `packages/shared/src/model-config.ts:68-86,378-422`; `packages/provider/src/config/rule-data-schema.ts:55-63`; `packages/provider/src/resolver.ts:292-301,330-345`; `packages/ui/src/settings/model-provider-section/ProviderModelMetadata.ts:130-135` |
| P-08 | **"Custom models default to 200K context": REFUTED for the current provider system.** (a) No hardcoded default exists in code (P-07). (b) With the shipped builtin file, an unmatched custom model inherits **1,000,000** from the catch-all first `modelRules` entry `"modelMatch": ".*"` with `"contextWindow": 1000000` (plus `maxOutputTokens 128000`) — it matches any modelId, case-insensitive; specific rules then override (e.g. `.*glm-5.*` → 200000). (c) 200K exists only as specific per-model rules and in the *legacy* layer: `MODEL_PROVIDER_NEW_MODEL_CONTEXT_WINDOW = 200_000`, comment scoping it to legacy config / missing metadata, applied in the legacy reader/serialiser only — not the current Provider registry path. (d) If a custom override file deletes the `.*` rule, an unconfigured custom model gets *no* context window and is rejected as non-executable — still not 200K. | Catch-all: `config/provider/zcode-builtin.json:1269-1275` (verified by parsing the file: first `modelRules` entry is `.*` → `contextWindow:1000000`); GLM-5 rule `config/provider/zcode-builtin.json:1304-1307`; matcher `packages/shared/src/model-config.ts:408,544-546`; legacy constant `packages/services/src/model-provider/legacyModelProviderSerialized.ts:344-357,435`; legacy application `packages/services/src/model-provider/legacyZCodeConfigProviderReader.ts:98,805` |

Provider mechanism verified against: `config/provider/zcode-builtin.json`, `packages/provider/src/config/provider-data-schema.ts`, `packages/provider/src/config/rule-data-schema.ts`, `packages/provider-node/src/zcode-builtin-provider-config-source.ts`, `packages/shared/src/model-config.ts`.

### DRAFT NVIDIA NIM template (NOT applied — draft for a later prompt)

Real format constraints (from `packages/provider/src/config/provider-data-schema.ts:103-115,66-78,32-38` and `packages/provider/src/config/rule-data-schema.ts:96-102`): a template is `{templateId, templateNameMap{zh-CN?,en-US?}, config}`; in `templateRules` the `config` is restricted to `logo, access, api, builtinModelIds`; `access` in a template has `apiKey` **omitted** (the user supplies the key on the personal provider created from the template); `logo` must be `{type:"builtin", key}` with an existing builtin asset key, so it is omitted below. Closest existing analog: `siliconflow-cn` at `config/provider/zcode-builtin.json:717-741`.

**Discrepancy against the brief's hypothesis, reported per instructions:** the template format has **no field for an env-var API key** (verified: no env-var key mechanism in `packages/provider/src`). The draft therefore references the key by env var name `NVIDIA_API_KEY` only as the deployment/operator contract; wiring an `NVIDIA_API_KEY` env fallback into personal-provider creation is later-prompt work, not something the current template format expresses. No literal key appears anywhere in this draft.

Template entry (goes into `config.providerConfigRules.templateRules[]` of a later edited builtin file / override file; bump top-level `revision`):

```json
{
  "templateId": "nvidia-nim",
  "templateNameMap": { "zh-CN": "NVIDIA NIM", "en-US": "NVIDIA NIM" },
  "config": {
    "access": { "type": "api-key", "apiKeyManagementUrl": "https://build.nvidia.com/explore/discover" },
    "api": { "type": "openai-chat-completions", "baseUrl": "https://integrate.api.nvidia.com/v1" },
    "builtinModelIds": [
      "moonshotai/kimi-k2.6",
      "z-ai/glm-5.3",
      "z-ai/glm-5.3-flash",
      "deepseek-ai/deepseek-v4.1-flash",
      "nvidia/nemotron-3-ultra-550b-a55b",
      "nvidia/nemotron-3-super-120b-a12b"
    ]
  }
}
```

Per-model context limits (go into `config.modelConfigRules.templateModelRules[]`; format per `packages/provider/src/config/rule-data-schema.ts:39-45`; sparse overlay — remaining complete fields come from the global `modelRules`/`modelApiRules`. Note P-08: with the shipped catch-all these would inherit 1,000,000 anyway; the explicit entries pin `1048576` regardless of the catch-all. `templateModelRules` only apply when the personal provider was created from this template — `packages/provider/src/resolver.ts:248,278-284`, `packages/shared/src/model-config.ts:402-405`):

```json
{ "templateId": "nvidia-nim", "modelId": "moonshotai/kimi-k2.6",                "config": { "enabled": true, "properties": { "contextWindow": 1048576 } } },
{ "templateId": "nvidia-nim", "modelId": "z-ai/glm-5.3",                        "config": { "enabled": true, "properties": { "contextWindow": 1048576 } } },
{ "templateId": "nvidia-nim", "modelId": "z-ai/glm-5.3-flash",                  "config": { "enabled": true, "properties": { "contextWindow": 1048576 } } },
{ "templateId": "nvidia-nim", "modelId": "deepseek-ai/deepseek-v4.1-flash",     "config": { "enabled": true, "properties": { "contextWindow": 1048576 } } },
{ "templateId": "nvidia-nim", "modelId": "nvidia/nemotron-3-ultra-550b-a55b",   "config": { "enabled": true, "properties": { "contextWindow": 1048576 } } },
{ "templateId": "nvidia-nim", "modelId": "nvidia/nemotron-3-super-120b-a12b",   "config": { "enabled": true, "properties": { "contextWindow": 1048576 } } }
```

Model IDs and the `1048576` values are as specified in the audit brief; verify both against NVIDIA's live NIM catalogue before any later prompt applies this draft.

---

## 0.1.4 Build and dev commands (exact script names, quoted from `package.json` / `mise.toml`)

Node/pnpm pinned by `mise.toml:1-3` (`node = "24.14.0"`, `pnpm = "10.33.2"`); engines `node >=24.0.0`, `packageManager pnpm@10.33.2` (`package.json:118-121`).

| Purpose | Exact command(s) | Source |
|---|---|---|
| Install | `pnpm install` (via mise task `install`: `mise exec -- node scripts/mise-run.mjs pnpm install`); root scripts `bootstrap` = `node scripts/bootstrap.mjs`, `bootstrap:with-remote`, `prepare` = `husky && pnpm build:cua`. There is no root `install` script — `pnpm install` is the install command. | `mise.toml:9-11`; `package.json:20,64-65` |
| Desktop dev run | `pnpm dev:desktop` → `pnpm run dev:desktop:prod` → `node scripts/dev-desktop-env.mjs production`; variants `dev:desktop:test`, `dev:desktop:bytecode`, `dev:desktop:remote-prod`; mise task `dev` runs `pnpm dev:desktop:test` with `ZCODE_DATA_BASE_DIR=~/.zcode-dev-home` | `package.json:9-14`; `mise.toml:18-25` |
| Web dev run | `pnpm dev:web` (server+web via concurrently); `dev:server` alone | `package.json:7,18` |
| Typecheck | `pnpm typecheck` (`tsc -b` over the listed projects + `tsc -p` desktop remote-main + zcode-cua) | `package.json:51` |
| Lint | `pnpm lint` (`oxlint`); `pnpm lint:fix`; format check `pnpm fmt:check` (`oxfmt --check`) | `package.json:53-54,62-63` |
| Tests | Engineering (only retained App-adjacent suite): `pnpm test:engineering` (`vitest run --project engineering`), `pnpm test:engineering:affected` (`node scripts/run-affected-engineering-tests.mjs`); architecture: `pnpm test:architecture`; E2E: `pnpm test:e2e` (desktop, Windows shards), `test:e2e:windows:sharded`, `test:e2e:container`, `test:e2e:all:coverage`; CLI: `pnpm --dir apps/zcode-cli test` (`turbo run test`, with `pretest` building `@zcode/model-option-map`). Per AGENTS.md, App business unit tests are retired — do not add/restore them. | `package.json:27-33,73,80-82`; `apps/zcode-cli/package.json` (`test`, `pretest`) |
| Production build (all) | `pnpm build` (`pnpm -r build`); bootstrap-safe variant `build:bootstrap`; CLI SEA `build:sea` / `build:sea:all` | `package.json:35,41-43` |
| Windows package/build | `pnpm bundle:desktop -- --os win --arch x64` (root `bundle:desktop` = `pnpm --filter @zcode/desktop run bundle --`; desktop `bundle` = `node scripts/bundle.mjs`; default target is mac arm64, output `packages/desktop/dist/`); desktop full build `pnpm --filter @zcode/desktop build` (`prepare:runtime-assets` + `build:no-runtime-assets`) | `package.json:52`; `packages/desktop/package.json` (`bundle`, `build`, `build:no-runtime-assets`); `README.md:156-164`; `packages/desktop/scripts/bundle.mjs:288-290,743` |
| Pre-push gate | `pnpm verify:pre-push` (worktree check, e2e-remote-targets, lint, stale-phrases, db schema, architecture tests+check, affected engineering tests) | `package.json:34` |

---

## Audit notes: where the code disagreed with the brief's hypotheses

1. **200K default — REFUTED** (P-08): current custom models inherit 1,000,000 via the `.*` catch-all rule in `config/provider/zcode-builtin.json:1269-1275`; 200K is legacy-layer only.
2. **Repo Wiki cloud call — does not exist** (Z-27): only a dead UI prop remains.
3. **Default provider is not in the JSON** (Z-01/Z-09): the builtin file has no default marker; the default is chosen in login UI code (`LoginApiKeyForm.helpers.ts:12-14`).
4. **No env-var API-key field in templates** (P-05/§0.1.3 draft): templates omit `apiKey` by schema; an `NVIDIA_API_KEY` env fallback does not exist yet for arbitrary named env vars.
5. **Two binaries share the name `zcode`** (R-30): agent CLI and server CLI — a later rename must resolve the collision deliberately.
6. **Preview and Prod share the `zcode://` scheme** (R-44): documented as an accepted upstream conflict; a rename inherits the decision.
7. Hypotheses confirmed: `ZCODE_BUILTIN_PROVIDER_CONFIG_FILE` exists and is runtime-only (P-05); custom providers speak OpenAI-compatible (`openai-chat-completions`) and Anthropic (`anthropic-messages`) plus OpenAI Responses (P-06); appId is centralised in one identity file (R-01…R-05).

## What was NOT done in this audit (by design)

No rename, no appId change, no provider addition/change, no UI/theme/layout/font/copy change, no update or telemetry disabling in code, no i18n edits. The NIM template above is a draft inside this document only. The only file created is `FORK.md`.
