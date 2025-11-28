import { PortfolioResponse, UserLeverageParams } from "./types";

import { BaseHttpClient } from "@/core/base";
import { EkidenClientConfig } from "@/core/config";
import { Validator } from "@/core/validation";
import { AuthorizeParams, AuthorizeResponse } from "@/types/common";

/**
 * Client for user authentication and portfolio operations
 */
export class UserClient extends BaseHttpClient {
  constructor(config: EkidenClientConfig) {
    super(config);
  }

  /**
   * Authorize user and get JWT token
   * @param params - Authorization parameters (signature, public key, etc.)
   * @returns Authorization response with token
   * @example
   * ```typescript
   * const { token } = await client.user.authorize({
   *   public_key: account.publicKey.toString(),
   *   timestamp_ms: Date.now(),
   *   nonce: Math.random().toString(36).slice(2),
   *   signature: "0x...",
   * });
   * await client.setToken(token);
   * ```
   */
  async authorize(params: AuthorizeParams): Promise<AuthorizeResponse> {
    const data = await this.request<AuthorizeResponse>("/authorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (data.token) this.setToken(data.token);
    return data;
  }

  /**
   * Get user's portfolio summary
   * @returns Portfolio with positions, vaults, and summary
   * @throws {AuthenticationError} If not authenticated
   * @example
   * ```typescript
   * const portfolio = await client.user.getUserPortfolio();
   * console.log(portfolio.summary.total_balance);
   * ```
   */
  async getUserPortfolio(): Promise<PortfolioResponse> {
    this.ensureAuth();
    return this.request<PortfolioResponse>(
      "/user/portfolio",
      {},
      { auth: true },
    );
  }

  /**
   * Get all portfolios for all sub-accounts
   * @returns Array of portfolios
   * @throws {AuthenticationError} If not authenticated
   */
  async getAllPortfolios(): Promise<PortfolioResponse[]> {
    this.ensureAuth();
    return this.request<PortfolioResponse[]>(
      "/user/portfolio/all",
      {},
      { auth: true },
    );
  }

  /**
   * Get user's leverage setting for a market
   * @param market_addr - Market address
   * @returns Current leverage setting
   * @throws {AuthenticationError} If not authenticated
   * @example
   * ```typescript
   * const { leverage } = await client.user.getUserLeverage("0x...");
   * ```
   */
  async getUserLeverage(
    market_addr: string,
  ): Promise<{ leverage: number; market_addr: string }> {
    this.ensureAuth();
    Validator.validateMarketAddress(market_addr);
    return this.request<{ leverage: number; market_addr: string }>(
      "/user/leverage",
      {},
      { auth: true, query: { market_addr } },
    );
  }

  /**
   * Get all leverage settings for all markets
   * @returns Array of leverage settings
   * @throws {AuthenticationError} If not authenticated
   */
  async getAllLeverages(): Promise<
    Array<{ leverage: number; market_addr: string; user_addr: string }>
  > {
    this.ensureAuth();
    return this.request<
      Array<{ leverage: number; market_addr: string; user_addr: string }>
    >("/user/leverage/all", {}, { auth: true });
  }

  /**
   * Set user's leverage for a market
   * @param params - Leverage parameters
   * @returns Updated portfolio
   * @throws {AuthenticationError} If not authenticated
   * @throws {ValidationError} If parameters are invalid
   * @example
   * ```typescript
   * await client.user.setUserLeverage({
   *   market_addr: "0x...",
   *   leverage: 5,
   * });
   * ```
   */
  async setUserLeverage(
    params: UserLeverageParams,
  ): Promise<PortfolioResponse> {
    this.ensureAuth();
    Validator.validateMarketAddress(params.market_addr);
    Validator.validateLeverage(params.leverage);
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
