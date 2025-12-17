import type {
  GetDepositRecordsParams,
  GetDepositRecordsResponse,
  GetWithdrawalRecordsParams,
  GetWithdrawalRecordsResponse,
} from "@/types/api";

import { BaseHttpClient } from "@/core/base";

export class AssetClient extends BaseHttpClient {
  async getDeposits(params: GetDepositRecordsParams = {}): Promise<GetDepositRecordsResponse> {
    this.ensureAuth();
    return this.request<GetDepositRecordsResponse>(
      "/asset/deposit/query-records",
      {},
      { auth: true, query: params }
    );
  }

  async getWithdrawals(
    params: GetWithdrawalRecordsParams = {}
  ): Promise<GetWithdrawalRecordsResponse> {
    this.ensureAuth();
    return this.request<GetWithdrawalRecordsResponse>(
      "/asset/withdraw/query-records",
      {},
      { auth: true, query: params }
    );
  }
}
