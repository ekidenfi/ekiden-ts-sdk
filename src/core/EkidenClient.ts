import type { EkidenClientConfig } from "./config";
import { ConfigurationError } from "./errors";

import { AccountClient } from "@/modules/account";
import { AssetClient } from "@/modules/asset";
import { FundingClient } from "@/modules/funding";
import { LeaderboardClient } from "@/modules/leaderboard";
import { MarketClient } from "@/modules/market";
import { PositionClient } from "@/modules/position";
import { TradeClient } from "@/modules/trade";
import { UserClient } from "@/modules/user";
import { VaultClient, VaultOnChainClient } from "@/modules/vault";
import { PrivateStream, PublicStream } from "@/streams";

export class EkidenClient {
  public readonly account: AccountClient;
  public readonly asset: AssetClient;
  public readonly funding: FundingClient;
  public readonly leaderboard: LeaderboardClient;
  public readonly market: MarketClient;
  public readonly trade: TradeClient;
  public readonly position: PositionClient;
  public readonly user: UserClient;
  public readonly vault: VaultClient;
  public readonly vaultOnChain: VaultOnChainClient;
  public readonly publicStream?: PublicStream;
  public readonly privateStream?: PrivateStream;

  constructor(public readonly config: EkidenClientConfig) {
    this.account = new AccountClient(config);
    this.asset = new AssetClient(config);
    this.funding = new FundingClient(config);
    this.leaderboard = new LeaderboardClient(config);
    this.market = new MarketClient(config);
    this.trade = new TradeClient(config);
    this.position = new PositionClient(config);
    this.user = new UserClient(config);
    this.vault = new VaultClient(config);
    this.vaultOnChain = new VaultOnChainClient(config);

    if (config.wsURL) {
      this.publicStream = new PublicStream(config);
    }

    if (config.privateWSURL) {
      this.privateStream = new PrivateStream(config.privateWSURL);
    }
  }

  setToken(token: string): void {
    this.account.setToken(token);
    this.asset.setToken(token);
    this.leaderboard.setToken(token);
    this.trade.setToken(token);
    this.position.setToken(token);
    this.user.setToken(token);
    this.vault.setToken(token);
  }

  async setTokens(tokens: {
    rest?: string;
    ws?: string;
    connectPrivateWS?: boolean;
  }): Promise<void> {
    const { rest, ws, connectPrivateWS = true } = tokens || {};

    if (rest) {
      this.account.setToken(rest);
      this.asset.setToken(rest);
      this.leaderboard.setToken(rest);
      this.trade.setToken(rest);
      this.position.setToken(rest);
      this.user.setToken(rest);
      this.vault.setToken(rest);
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
