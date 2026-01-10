import { BaseHttpClient } from "@/core/base";
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

export class TradeClient extends BaseHttpClient {
	async placeOrder(params: PlaceOrderRequest): Promise<PlaceOrderResponse> {
		return this.post<PlaceOrderResponse>("/order/place", params);
	}

	async batchPlaceOrders(params: BatchPlaceOrdersRequest): Promise<BatchPlaceOrdersResponse> {
		return this.post<BatchPlaceOrdersResponse>("/order/place-batch", params);
	}

	async amendOrder(params: AmendOrderRequest): Promise<AmendOrderResponse> {
		return this.post<AmendOrderResponse>("/order/amend", params);
	}

	async batchAmendOrders(params: BatchAmendOrdersRequest): Promise<BatchAmendOrdersResponse> {
		return this.post<BatchAmendOrdersResponse>("/order/amend-batch", params);
	}

	async cancelOrder(params: CancelOrderRequest): Promise<CancelOrderResponse> {
		return this.post<CancelOrderResponse>("/order/cancel", params);
	}

	async batchCancelOrders(params: BatchCancelOrdersRequest): Promise<BatchCancelOrdersResponse> {
		return this.post<BatchCancelOrdersResponse>("/order/cancel-batch", params);
	}

	async cancelAllOrders(params: CancelAllOrdersRequest = {}): Promise<CancelAllOrdersResponse> {
		return this.post<CancelAllOrdersResponse>("/order/cancel-all", params);
	}

	async getRealtimeOrders(params: GetRealtimeOrdersParams): Promise<OrderListResponse> {
		this.ensureAuth();
		return this.request<OrderListResponse>(
			"/order/realtime",
			{},
			{ auth: true, query: params }
		);
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
