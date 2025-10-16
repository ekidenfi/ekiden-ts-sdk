import { HttpClient } from "@/api/http";
import type { EkidenClientConfig } from "@/config";

export class HttpAPIClient {
  api: HttpClient;

  constructor(readonly config: EkidenClientConfig) {
    this.api = new HttpClient({ baseURL: config.baseURL, apiPrefix: config.apiPrefix });
  }

  async authorize(params: Parameters<HttpClient["authorize"]>[0]) {
    return this.api.authorize(params);
  }

  async getMarkets() {
    return this.api.getMarkets();
  }

  async getMarketInfo(params?: Parameters<HttpClient["getMarketInfo"]>[0]) {
    return this.api.getMarketInfo(params);
  }

  async getOrders(params: Parameters<HttpClient["getOrders"]>[0]) {
    return this.api.getOrders(params);
  }

  async getFills(params: Parameters<HttpClient["getFills"]>[0]) {
    return this.api.getFills(params);
  }

  async getUserOrders(params: Parameters<HttpClient["getUserOrders"]>[0]) {
    return this.api.getUserOrders(params);
  }

  async sendIntent(params: Parameters<HttpClient["sendIntent"]>[0]) {
    return this.api.sendIntent(params);
  }

  async sendIntentWithCommit(
    params: Parameters<HttpClient["sendIntentWithCommit"]>[0],
  ) {
    return this.api.sendIntentWithCommit(params);
  }

  async getUserFills(params: Parameters<HttpClient["getUserFills"]>[0]) {
    return this.api.getUserFills(params);
  }

  async getUserVaults(params?: Parameters<HttpClient["getUserVaults"]>[0]) {
    return this.api.getUserVaults(params);
  }

  async getUserPositions(
    params?: Parameters<HttpClient["getUserPositions"]>[0],
  ) {
    return this.api.getUserPositions(params);
  }

  async getFundingRates(params?: Parameters<HttpClient["getFundingRates"]>[0]) {
    return this.api.getFundingRates(params);
  }

  async getFundingRateByMarket(
    marketAddr: Parameters<HttpClient["getFundingRateByMarket"]>[0],
  ) {
    return this.api.getFundingRateByMarket(marketAddr);
  }

  async getFundingEpoch() {
    return this.api.getFundingEpoch();
  }

  async getCandles(params: Parameters<HttpClient["getCandles"]>[0]) {
    return this.api.getCandles(params);
  }

  async getMarketStats(
    marketAddr: Parameters<HttpClient["getMarketStats"]>[0],
  ) {
    return this.api.getMarketStats(marketAddr);
  }

  async getUserPortfolio() {
    return this.api.getUserPortfolio();
  }

  async getUserLeverage(market_addr: string) {
    return this.api.getUserLeverage(market_addr);
  }

  async setUserLeverage(params: Parameters<HttpClient["setUserLeverage"]>[0]) {
    return this.api.setUserLeverage(params);
  }

  async withdrawFromTrading(
    params: Parameters<HttpClient["withdrawFromTrading"]>[0],
  ) {
    return this.api.withdrawFromTrading(params);
  }
}
