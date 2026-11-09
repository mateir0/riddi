import { ProviderRegistryService } from "@zcode/provider";
import {
  NodeProviderConfigRuntime,
  type NodeProviderConfigRuntimeOptions,
} from "./provider-config-runtime.js";

/** 一个 Node.js 进程内共享的 Config + Registry 生命周期。 */
export class NodeProviderRegistryRuntime {
  readonly configService: NodeProviderConfigRuntime["configService"];
  readonly registryService: ProviderRegistryService;
  readonly #configRuntime: NodeProviderConfigRuntime;
  #disposed = false;

  constructor(options: NodeProviderConfigRuntimeOptions) {
    this.#configRuntime = new NodeProviderConfigRuntime(options);
    this.configService = this.#configRuntime.configService;
    this.registryService = new ProviderRegistryService({
      configSource: this.configService,
    });
  }

  get personalRepository() {
    return this.#configRuntime.personalRepository;
  }

  async start(): Promise<void> {
    if (this.#disposed) throw new Error("NodeProviderRegistryRuntime 已 dispose");
    await this.registryService.start();
  }

  async refresh(reason: string): Promise<void> {
    if (this.#disposed) throw new Error("NodeProviderRegistryRuntime 已 dispose");
    await this.registryService.refresh(reason);
  }

  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    this.registryService.dispose();
    this.#configRuntime.dispose();
  }
}
