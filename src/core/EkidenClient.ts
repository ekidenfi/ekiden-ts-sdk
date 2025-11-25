import { EkidenClientConfig } from "./config";

import { FundingClient } from "@/modules/funding";
import { LeaderboardClient } from "@/modules/leaderboard";
import { MarketClient } from "@/modules/market";
import { OrderClient } from "@/modules/order";
import { PositionClient } from "@/modules/position";
import { UserClient } from "@/modules/user";
import { VaultClient, VaultOnChain } from "@/modules/vault";
import { PrivateStream, PublicStream } from "@/streams";

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

  async setToken(token: string): Promise<void> {
    this.user.setToken(token);
    this.order.setToken(token);
    this.position.setToken(token);
    this.vault.setToken(token);
    this.leaderboard.setToken(token);

    if (this.privateStream) {
      this.privateStream.setToken(token);
      await this.privateStream.connect();
    }
  }

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
      this.privateStream.close();
      this.privateStream.setToken(ws);
      if (connectPrivateWS) {
        await this.privateStream.connect();
      }
    }
  }

  subscribeTo(topics: string[], handler: (data: any) => void): void {
    if (!this.privateStream) {
      throw new Error("Private WebSocket not configured");
    }
    this.privateStream.subscribe(topics, handler);
  }

  unsubscribeFrom(topics: string[], handler: (data: any) => void): void {
    if (!this.privateStream) {
      throw new Error("Private WebSocket not configured");
    }
    this.privateStream.unsubscribe(topics, handler);
  }

  subscribeHandlers(handlers: Record<string, (data: any) => void>): void {
    if (!this.privateStream) {
      throw new Error("Private WebSocket not configured");
    }
    this.privateStream.subscribe(handlers);
  }

  unsubscribeHandlers(handlers: Record<string, (data: any) => void>): void {
    if (!this.privateStream) {
      throw new Error("Private WebSocket not configured");
    }
    this.privateStream.unsubscribe(handlers);
  }
}
