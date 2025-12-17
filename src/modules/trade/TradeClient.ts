import type {
  AmendOrderRequest,
  AmendOrderResponse,
  BatchAmendOrdersRequest,
  BatchAmendOrdersResponse,
  BatchCancelOrdersRequest,
  BatchCancelOrdersResponse,
  BatchPlaceOrdersRequest,
  BatchPlaceOrdersResponse,
  CancelAllOrdersRequest,
  CancelAllOrdersResponse,
  CancelOrderRequest,
  CancelOrderResponse,
  GetOrderHistoryParams,
  GetRealtimeOrdersParams,
  GetTradeHistoryParams,
  GetTradeHistoryResponse,
  OrderListResponse,
  PlaceOrderRequest,
  PlaceOrderResponse,
} from "@/types/api";

import { BaseHttpClient } from "@/core/base";

export class TradeClient extends BaseHttpClient {
  async placeOrder(params: PlaceOrderRequest): Promise<PlaceOrderResponse> {
    this.ensureAuth();
    return this.request<PlaceOrderResponse>(
      "/order/place",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      },
      { auth: true }
    );
  }

  async batchPlaceOrders(params: BatchPlaceOrdersRequest): Promise<BatchPlaceOrdersResponse> {
    this.ensureAuth();
    return this.request<BatchPlaceOrdersResponse>(
      "/order/place-batch",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      },
      { auth: true }
    );
  }

  async amendOrder(params: AmendOrderRequest): Promise<AmendOrderResponse> {
    this.ensureAuth();
    return this.request<AmendOrderResponse>(
      "/order/amend",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      },
      { auth: true }
    );
  }

  async batchAmendOrders(params: BatchAmendOrdersRequest): Promise<BatchAmendOrdersResponse> {
    this.ensureAuth();
    return this.request<BatchAmendOrdersResponse>(
      "/order/amend-batch",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      },
      { auth: true }
    );
  }

  async cancelOrder(params: CancelOrderRequest): Promise<CancelOrderResponse> {
    this.ensureAuth();
    return this.request<CancelOrderResponse>(
      "/order/cancel",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      },
      { auth: true }
    );
  }

  async batchCancelOrders(params: BatchCancelOrdersRequest): Promise<BatchCancelOrdersResponse> {
    this.ensureAuth();
    return this.request<BatchCancelOrdersResponse>(
      "/order/cancel-batch",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      },
      { auth: true }
    );
  }

  async cancelAllOrders(params: CancelAllOrdersRequest = {}): Promise<CancelAllOrdersResponse> {
    this.ensureAuth();
    return this.request<CancelAllOrdersResponse>(
      "/order/cancel-all",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      },
      { auth: true }
    );
  }

  async getRealtimeOrders(params: GetRealtimeOrdersParams): Promise<OrderListResponse> {
    this.ensureAuth();
    return this.request<OrderListResponse>("/order/realtime", {}, { auth: true, query: params });
  }

  async getOrderHistory(params: GetOrderHistoryParams = {}): Promise<OrderListResponse> {
    this.ensureAuth();
    return this.request<OrderListResponse>("/order/history", {}, { auth: true, query: params });
  }

  async getTradeHistory(params: GetTradeHistoryParams = {}): Promise<GetTradeHistoryResponse> {
    this.ensureAuth();
    return this.request<GetTradeHistoryResponse>(
      "/execution/list",
      {},
      { auth: true, query: params }
    );
  }
}
