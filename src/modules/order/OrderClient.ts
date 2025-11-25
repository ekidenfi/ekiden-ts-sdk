import {
  FillResponse,
  ListFillsParams,
  ListOrdersParams,
  ListUserFillsParams,
  ListUserOrdersParams,
  OrderResponse,
  SendIntentParams,
  SendIntentResponse,
  SendIntentWithCommitResponse,
} from "./types";

import { BaseHttpClient } from "@/core/base";
import { EkidenClientConfig } from "@/core/config";

export class OrderClient extends BaseHttpClient {
  constructor(config: EkidenClientConfig) {
    super(config);
  }

  async getOrders(params: ListOrdersParams): Promise<OrderResponse[]> {
    return this.request<OrderResponse[]>(
      "/market/orders",
      {},
      { query: params },
    );
  }

  async getFills(params: ListFillsParams): Promise<FillResponse[]> {
    return this.request<FillResponse[]>("/market/fills", {}, { query: params });
  }

  async getUserOrders(
    params: ListUserOrdersParams = {},
  ): Promise<OrderResponse[]> {
    this.ensureAuth();
    return this.request<OrderResponse[]>(
      "/user/orders",
      {},
      { auth: true, query: params },
    );
  }

  async getUserFills(
    params: ListUserFillsParams = {},
  ): Promise<FillResponse[]> {
    this.ensureAuth();
    return this.request<FillResponse[]>(
      "/user/fills",
      {},
      { auth: true, query: params },
    );
  }

  async sendIntent(params: SendIntentParams): Promise<SendIntentResponse> {
    this.ensureAuth();
    return this.request<SendIntentResponse>(
      "/user/intent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      },
      { auth: true },
    );
  }

  async sendIntentWithCommit(
    params: SendIntentParams,
  ): Promise<SendIntentWithCommitResponse> {
    this.ensureAuth();
    return this.request<SendIntentWithCommitResponse>(
      "/user/intent/commit",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      },
      { auth: true },
    );
  }
}
