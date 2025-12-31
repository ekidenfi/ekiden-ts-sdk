import { BaseHttpClient } from "@/core/base/BaseHttpClient";
import type { SystemInfo } from "@/types";

export class SystemClient extends BaseHttpClient {
  /**
   * Get system configuration and discovery info.
   */
  async getSystemInfo(): Promise<SystemInfo> {
    return this.request<SystemInfo>("/info");
  }
}
