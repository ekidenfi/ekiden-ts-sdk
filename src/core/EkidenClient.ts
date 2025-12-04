import type { EkidenClientConfig } from "./config";
import { ConfigurationError } from "./errors";

import { FundingClient } from "@/modules/funding";
import { LeaderboardClient } from "@/modules/leaderboard";
import { MarketClient } from "@/modules/market";
import { OrderClient } from "@/modules/order";
import { PositionClient } from "@/modules/position";
import { UserClient } from "@/modules/user";
import { VaultClient, VaultOnChain } from "@/modules/vault";
import { PrivateStream, PublicStream } from "@/streams";

/**
 * Main Ekiden SDK client
 * @example
 * ```typescript
 * import { EkidenClient, TESTNET } from "@ekidenfi/ts-sdk";
 *
 * const ekiden = new EkidenClient(TESTNET);
 *
 * const { token } = await ekiden.user.authorize({...});
 * await ekiden.setToken(token);
 *
 * const markets = await ekiden.market.getMarkets();
 * const orders = await ekiden.order.getUserOrders();
 * ```
 */
export class EkidenClient {
  public readonly market: MarketClient;
  public readonly order: OrderClient;
  public readonly user: UserClient;
  public readonly position: PositionClient;
  public readonly vault: VaultClient;
  public readonly vaultOnChain: VaultOnChain;
  public readonly funding: FundingClient;
  public readonly leaderboard: LeaderboardClient;
  public readonly publicStream?: PublicStream;
  public readonly privateStream?: PrivateStream;

  constructor(public readonly config: EkidenClientConfig) {
    this.market = new MarketClient(config);
    this.order = new OrderClient(config);
    this.user = new UserClient(config);
    this.position = new PositionClient(config);
    this.vault = new VaultClient(config);
    this.vaultOnChain = new VaultOnChain();
    this.funding = new FundingClient(config);
    this.leaderboard = new LeaderboardClient(config);

    if (config.wsURL) {
      this.publicStream = new PublicStream(config);
    }

    if (config.privateWSURL) {
      this.privateStream = new PrivateStream(config.privateWSURL);
    }
  }

  /**
   * Set authentication token for all clients
   * @param token - JWT token from authorize()
   * @example
   * ```typescript
   * await ekiden.setToken(token);
   * ```
   */
  setToken(token: string): void {
    this.user.setToken(token);
    this.order.setToken(token);
    this.position.setToken(token);
    this.vault.setToken(token);
    this.leaderboard.setToken(token);
  }

  /**
   * Set different tokens for REST API and WebSocket
   * @param tokens - Separate tokens for REST and WS
   * @example
   * ```typescript
   * await ekiden.setTokens({
   *   rest: tradingAccountToken,
   *   ws: rootAccountToken,
   * });
   * ```
   */
  async setTokens(tokens: {
    rest?: string;
    ws?: string;
    connectPrivateWS?: boolean;
  }): Promise<void> {
    const { rest, ws, connectPrivateWS = true } = tokens || {};

    if (rest) {
      this.user.setToken(rest);
      this.order.setToken(rest);
      this.position.setToken(rest);
      this.vault.setToken(rest);
      this.leaderboard.setToken(rest);
    }

    if (this.privateStream && ws) {
      this.privateStream.setToken(ws);
      if (connectPrivateWS) {
        await this.privateStream.connect();
      }
    }
  }

  subscribeTo(topics: string[], handler: (data: any) => void): void {
    if (!this.privateStream) {
      throw new ConfigurationError("Private WebSocket not configured");
    }
    this.privateStream.subscribe(topics, handler);
  }

  unsubscribeFrom(topics: string[], handler: (data: any) => void): void {
    if (!this.privateStream) {
      throw new ConfigurationError("Private WebSocket not configured");
    }
    this.privateStream.unsubscribe(topics, handler);
  }

  subscribeHandlers(handlers: Record<string, (data: any) => void>): void {
    if (!this.privateStream) {
      throw new ConfigurationError("Private WebSocket not configured");
    }
    this.privateStream.subscribe(handlers);
  }

  unsubscribeHandlers(handlers: Record<string, (data: any) => void>): void {
    if (!this.privateStream) {
      throw new ConfigurationError("Private WebSocket not configured");
    }
    this.privateStream.unsubscribe(handlers);
  }
}
