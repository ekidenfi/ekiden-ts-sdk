import type {
  AuthorizeRequest,
  AuthorizeResponse,
  GetLeaderboardParams,
  GetRootAccountResponse,
  GetSubAccountsResponse,
  LeaderboardResponse,
} from "@/types/api";

import { BaseHttpClient } from "@/core/base";

export class UserClient extends BaseHttpClient {
  async authorize(params: AuthorizeRequest): Promise<AuthorizeResponse> {
    const data = await this.request<AuthorizeResponse>("/authorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (data.token) this.setToken(data.token);
    return data;
  }

  async getRootAccount(): Promise<GetRootAccountResponse> {
    this.ensureAuth();
    return this.request<GetRootAccountResponse>("/user/root-account", {}, { auth: true });
  }

  async getSubAccounts(): Promise<GetSubAccountsResponse> {
    this.ensureAuth();
    return this.request<GetSubAccountsResponse>("/user/sub-accounts", {}, { auth: true });
  }

  async getLeaderboard(params: GetLeaderboardParams): Promise<LeaderboardResponse> {
    return this.request<LeaderboardResponse>("/user/leaderboard", {}, { query: params });
  }

  async getAllLeverages(): Promise<{ market_addr: string; leverage: number; user_addr: string }[]> {
    this.ensureAuth();
    return this.request<{ market_addr: string; leverage: number; user_addr: string }[]>("/user/leverages", {}, { auth: true });
  }
}
