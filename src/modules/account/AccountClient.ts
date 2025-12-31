import type {
  ApiTransferRequest,
  ApiTransferResponse,
  ApiWithdrawRequest,
  ApiWithdrawResponse,
  FundRequest,
  FundResult,
  GetAccountBalanceResponse,
} from "@/types/api";

import { BaseHttpClient } from "@/core/base";

export class AccountClient extends BaseHttpClient {
  async getBalance(): Promise<GetAccountBalanceResponse> {
    this.ensureAuth();
    return this.request<GetAccountBalanceResponse>("/account/balance", {}, { auth: true });
  }

  async fund(params: FundRequest): Promise<FundResult> {
    return this.request<FundResult>("/account/fund", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
  }

  async transfer(params: ApiTransferRequest): Promise<ApiTransferResponse> {
    this.ensureAuth();
    return this.request<ApiTransferResponse>(
      "/account/transfer",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      },
      { auth: true }
    );
  }

  async withdraw(params: ApiWithdrawRequest): Promise<ApiWithdrawResponse> {
    this.ensureAuth();
    return this.request<ApiWithdrawResponse>(
      "/account/withdraw",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      },
      { auth: true }
    );
  }
}
