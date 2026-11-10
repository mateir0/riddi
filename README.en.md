<div align="center">
  <img src="public/logo/icons/1024x1024.png" alt="Riddi" width="128" height="128" />
</div>

# Riddi

A personal fork of [ZCode](https://github.com/zai-org/ZCode), rebuilt around NVIDIA NIM.
Not affiliated with Z.ai.

## Why it exists

ZCode is a good coding agent bolted to a Z.ai account and Z.ai's cloud. You sign in, your
keys and telemetry go to their servers, and the model list is theirs.

Riddi removes the lock-in. No account. No vendor cloud. No telemetry to the vendor. You
bring an NVIDIA API key, the key lives on your machine, and the model list is yours.

## What changed vs upstream

- **NVIDIA NIM is the default provider.** Upstream's Z.ai / BigModel providers are gone.
- **Z.ai / BigModel sign-in and OAuth removed.** No `zai` or `bigmodel` OAuth defines are
  built into the app at all.
- **Coding Plan commerce removed.** No subscription, plan, or billing surfaces.
- **Phone remote control via the vendor relay removed.** Remote workspaces still work over
  your own SSH / WSL / Docker targets.
- **Rewards, share pages, and vendor CDN content removed.** Community and feedback links
  point at this repo, not a vendor site.
- **Auto-update from vendor servers disabled.** The update feed is not wired to any vendor
  host — you rebuild and install manually.
- **Binaries renamed:** `riddi` and `riddi-server`.
- **Data lives in `~/.riddi`.** Project-scoped folders still use `.zcode` inside your repo.
- **`NVIDIA_API_KEY` env fallback.** A stored key always wins; the env var is only read when
  no key is stored, and it is never written to disk or logs.

Other provider templates remain in the built-in catalog (OpenAI, Anthropic, OpenRouter,
DeepSeek, Kimi, MiniMax, StepFun, and others). Point them at your own keys if you want them.
Nothing is pre-wired to a vendor account.

## Install

Build the Windows installer:

```powershell
pnpm install
pnpm bundle:desktop -- --os win --arch x64
```

The installer lands in `packages/desktop/dist/` as `Riddi-3.17.2-win-x64.exe`. It is
unsigned, so SmartScreen will warn on first run.

To build from source instead:

```powershell
pnpm install
pnpm build
```

## Quick start

1. Launch Riddi. It opens straight into a workspace — there is no login screen.
2. Open **Settings → Models → NVIDIA NIM** and paste your key.
   Keys look like `nvapi-...`; get one at
   <https://build.nvidia.com/explore/discover>.
3. Type a prompt.

Instead of storing the key in the app, set it in your shell before launching:

```powershell
$env:NVIDIA_API_KEY = "nvapi-..."
```

## Commands

| Command | What it is |
| --- | --- |
| `riddi` | The CLI and agent runtime |
| `riddi-server` | The server CLI |

## Updates

Manual. Rebuild the installer and install it over the old one. Your `~/.riddi` data
survives — sessions, credentials, and settings are not touched by an install.

## More

- [`README-RIDDI.md`](README-RIDDI.md) — the fuller quickstart, build, and install notes.
- [`FORK.md`](FORK.md) — the audit map of everything removed from upstream and why.

## Credits

Fork of [zai-org/ZCode](https://github.com/zai-org/ZCode), Apache-2.0. All upstream
attribution and third-party notices are preserved in `LICENSE`, `NOTICE.md`,
`THIRD-PARTY-NOTICES.md`, and `third-party/`.
