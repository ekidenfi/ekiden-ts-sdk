import { EkidenAPIClient } from "../api/http";
import type { EkidenConfig } from "../config";

export class EkidenClient {
  api: EkidenAPIClient;

  constructor(readonly config: EkidenConfig) {
    this.api = new EkidenAPIClient(config);
  }

  async authorize(params: Parameters<EkidenAPIClient["authorize"]>[0]) {
    return this.api.authorize(params);
  }

  async getMarkets() {
    return this.api.getMarkets();
  }

  async getOrders(params: Parameters<EkidenAPIClient["getOrders"]>[0]) {
    return this.api.getOrders(params);
  }

  async getFills(params: Parameters<EkidenAPIClient["getFills"]>[0]) {
    return this.api.getFills(params);
  }

  async getUserOrders(params: Parameters<EkidenAPIClient["getUserOrders"]>[0]) {
    return this.api.getUserOrders(params);
  }

  async createOrder(params: Parameters<EkidenAPIClient["createOrder"]>[0]) {
    return this.api.createOrder(params);
  }

  async getUserFills(params: Parameters<EkidenAPIClient["getUserFills"]>[0]) {
    return this.api.getUserFills(params);
  }

  async getUserVaults(
    params?: Parameters<EkidenAPIClient["getUserVaults"]>[0],
  ) {
    return this.api.getUserVaults(params);
  }

  async getUserPositions(
    params?: Parameters<EkidenAPIClient["getUserPositions"]>[0],
  ) {
    return this.api.getUserPositions(params);
  }
}
