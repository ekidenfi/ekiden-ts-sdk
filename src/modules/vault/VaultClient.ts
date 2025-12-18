import { BaseHttpClient } from "@/core/base";

export interface WithdrawFromTradingParams {
  addr_from: string;
  addr_to: string;
  amount: number;
  asset_metadata: string;
  nonce: number;
  signature: string;
  timestamp: number;
  withdraw_available: boolean;
}

export class VaultClient extends BaseHttpClient {
  async withdrawFromTrading(params: WithdrawFromTradingParams): Promise<void> {
    this.ensureAuth();
    await this.request(
      "/vault/withdraw-from-trading",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      },
      { auth: true }
    );
  }
}
