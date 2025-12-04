import type {
  ListVaultsParams,
  VaultResponse,
  WithdrawFromTradingParams,
  WithdrawFromTradingResponse,
} from "./types";

import { BaseHttpClient } from "@/core/base";

export class VaultClient extends BaseHttpClient {
  async getUserVaults(params: ListVaultsParams = {}): Promise<VaultResponse[]> {
    this.ensureAuth();
    return this.request<VaultResponse[]>("/user/vaults", {}, { auth: true, query: params });
  }

  async withdrawFromTrading(
    params: WithdrawFromTradingParams
  ): Promise<WithdrawFromTradingResponse> {
    this.ensureAuth();
    return this.request<WithdrawFromTradingResponse>(
      "/user/vaults/withdraw",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      },
      { auth: true }
    );
  }
}
