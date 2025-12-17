import type { GetAccountBalanceResponse } from "@/types/api";

import { BaseHttpClient } from "@/core/base";

export class AccountClient extends BaseHttpClient {
  async getBalance(): Promise<GetAccountBalanceResponse> {
    this.ensureAuth();
    return this.request<GetAccountBalanceResponse>("/account/balance", {}, { auth: true });
  }
}
