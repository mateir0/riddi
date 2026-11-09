# Riddi

Riddi is a personal fork of [ZCode](https://github.com/zai-org/ZCode). It is the same coding agent,
pointed at your own model provider instead of a Z.ai account.

What changed for you:

- **No account.** The app opens straight to a workspace. There is no sign-in, no login gate,
  no Coding Plan.
- **NVIDIA NIM by default.** The built-in provider catalogue ships an NVIDIA NIM template
  (`https://integrate.api.nvidia.com/v1`) as the default choice. Other third-party templates
  (Kimi, DeepSeek, Qwen, MiniMax, OpenAI, Anthropic, xAI, OpenRouter, and friends) are still
  there if you want them.
- **No Z.ai traffic.** All vendor endpoints, OAuth, telemetry, auto-update feeds and plugin CDN
  defaults were removed. Nothing in the app calls a Z.ai host.

## Install

Build the Windows installer from a checkout of this repo:

```powershell
pnpm install
pnpm bundle:desktop -- --os win --arch x64
```

The artifact lands in `packages/desktop/dist`:

```
Riddi-3.17.2-win-x64.exe          189.1 MiB   (production identity)
Riddi Preview-3.17.2-win-x64_TEST.exe   189.1 MiB   (preview identity, test backend)
```

Take `Riddi-3.17.2-win-x64.exe`. The `_TEST` one is the preview build that runs against the test
backend — do not use it for daily driving. The installer is unsigned, so SmartScreen will warn on
first run.

`ZCODE_ENV=production pnpm bundle:desktop -- --os win --arch x64` builds the production artifact;
`ZCODE_PREVIEW_IDENTITY=1` forces the preview identity on a production backend.

## First run

Launch Riddi. It opens directly into a workspace — there is no login screen and nothing to
sign in to. Add a project folder and start typing.

## Add your NVIDIA NIM key

Open **Settings → Models → NVIDIA NIM** and paste your key. The key management page is
<https://build.nvidia.com/explore/discover>; keys look like `nvapi-...`.

## Or use an environment variable

If you prefer not to store the key in the app, set it in your shell before launching:

```powershell
$env:NVIDIA_API_KEY = "nvapi-..."
riddi
```

With `NVIDIA_API_KEY` set and no stored key, the app picks up the env key and answers prompts
normally. This is the same behaviour on a restart: clear the stored key in Settings, keep the env
var, and prompts still work.

## Commands

| Command | What it is |
| --- | --- |
| `riddi` | The agent CLI. `riddi --help` lists everything. |
| `riddi-server` | The server CLI used for remote workspaces and source-server deploys. |

On Windows the server launcher is `riddi-server.cmd`.

## Where Riddi keeps its data

App data lives in `~/.riddi`:

```
~/.riddi/v2/          credentials, config, provider config, sqlite index, sessions
~/.riddi/workspace/   the default non-project conversation workspace
~/.riddi/AGENTS.md    your user-level instructions
~/.riddi/cli/         CLI config, log, rollout
```

Project folders keep their own `.zcode/` directory for project-local skills, commands, agents and
config. That is deliberate: `.zcode/` is the on-disk convention shared with the CLI and the
existing project tooling, and renaming it was out of scope.

## Building from source

```powershell
pnpm install
pnpm dev:desktop
```

Node version is pinned in `mise.toml` (24.14.0) and pnpm in `package.json` (10.33.2).

## Smoke test

This is the check run after installing a fresh build, in order:

1. Install from `Riddi-3.17.2-win-x64.exe`.
2. Launch — the app opens to a workspace, no login.
3. Add the NIM key in Settings → Models → NVIDIA NIM.
4. Send one prompt; a NIM model answers.
5. Clear the stored key, leave only `NVIDIA_API_KEY` set in the environment, restart the app,
   send the same prompt — it still works.
6. `riddi --help` from a terminal.
7. Open a `riddi://` share link.

FORK.md is the audit document for this fork — it records what was stripped and why. It is not
user documentation.
