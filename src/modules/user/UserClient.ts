import { PortfolioResponse, UserLeverageParams } from "./types";

import { BaseHttpClient } from "@/core/base";
import { EkidenClientConfig } from "@/core/config";
import { AuthorizeParams, AuthorizeResponse } from "@/types/common";

export class UserClient extends BaseHttpClient {
  constructor(config: EkidenClientConfig) {
    super(config);
  }

  async authorize(params: AuthorizeParams): Promise<AuthorizeResponse> {
    const data = await this.request<AuthorizeResponse>("/authorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (data.token) this.setToken(data.token);
    return data;
  }

  async getUserPortfolio(): Promise<PortfolioResponse> {
    this.ensureAuth();
    return this.request<PortfolioResponse>(
      "/user/portfolio",
      {},
      { auth: true },
    );
  }

  async getAllPortfolios(): Promise<PortfolioResponse[]> {
    this.ensureAuth();
    return this.request<PortfolioResponse[]>(
      "/user/portfolio/all",
      {},
      { auth: true },
    );
  }

  async getUserLeverage(
    market_addr: string,
  ): Promise<{ leverage: number; market_addr: string }> {
    this.ensureAuth();
    return this.request<{ leverage: number; market_addr: string }>(
      "/user/leverage",
      {},
      { auth: true, query: { market_addr } },
    );
  }

  async getAllLeverages(): Promise<
    Array<{ leverage: number; market_addr: string; user_addr: string }>
  > {
    this.ensureAuth();
    return this.request<
      Array<{ leverage: number; market_addr: string; user_addr: string }>
    >("/user/leverage/all", {}, { auth: true });
  }

  async setUserLeverage(
    params: UserLeverageParams,
  ): Promise<PortfolioResponse> {
    this.ensureAuth();
    return this.request<PortfolioResponse>(
      "/user/leverage",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      },
      { auth: true },
    );
  }
}
