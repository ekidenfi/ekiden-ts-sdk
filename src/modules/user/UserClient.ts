import type {
  AuthorizeRequest,
  AuthorizeResponse,
  GetLeaderboardParams,
  GetRootAccountResponse,
  GetSubAccountsResponse,
  LeaderboardResponse,
} from "@/types/api";

import { Account } from "@aptos-labs/ts-sdk";
import { BaseHttpClient } from "@/core/base";
import { generateAuthorizePayload } from "@/utils/account";

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

  async authorizeWithAccount(account: Account): Promise<AuthorizeResponse> {
    const { timestamp_ms, nonce, message } = generateAuthorizePayload();
    const messageBytes = new TextEncoder().encode(message);
    const signature = account.sign(messageBytes).toString();

    return this.authorize({
      signature,
      public_key: account.publicKey.toString(),
      timestamp_ms,
      nonce,
    });
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
    return this.request<{ market_addr: string; leverage: number; user_addr: string }[]>(
      "/user/leverages",
      {},
      { auth: true }
    );
  }
}
