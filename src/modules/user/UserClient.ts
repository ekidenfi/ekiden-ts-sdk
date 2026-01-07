import type {
  AuthorizeRequest,
  AuthorizeResponse,
  GetRootAccountResponse,
  GetSubAccountsResponse,
} from "@/types/api";

import { BaseHttpClient } from "@/core/base";
import { generateAuthorizePayload } from "@/utils/account";
import { Account } from "@aptos-labs/ts-sdk";

export class UserClient extends BaseHttpClient {
  async authorize(params: AuthorizeRequest): Promise<AuthorizeResponse> {
    const data = await this.post<AuthorizeResponse>("/authorize", params, { auth: false });
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
}
