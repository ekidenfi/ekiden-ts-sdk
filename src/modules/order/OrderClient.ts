import type {
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
import { Validator } from "@/core/validation";

/**
 * Client for order and fill operations
 */
export class OrderClient extends BaseHttpClient {
  /**
   * Get public orders for a market
   * @param params - Order query parameters
   * @returns List of orders
   * @example
   * ```typescript
   * const orders = await client.order.getOrders({
   *   market_addr: "0x...",
   *   side: "buy",
   * });
   * ```
   */
  async getOrders(params: ListOrdersParams): Promise<OrderResponse[]> {
    return this.request<OrderResponse[]>("/market/orders", {}, { query: params });
  }

  /**
   * Get public fills for a market
   * @param params - Fill query parameters
   * @returns List of fills
   * @example
   * ```typescript
   * const fills = await client.order.getFills({ market_addr: "0x..." });
   * ```
   */
  async getFills(params: ListFillsParams): Promise<FillResponse[]> {
    return this.request<FillResponse[]>("/market/fills", {}, { query: params });
  }

  /**
   * Get authenticated user's orders
   * @param params - Optional filter parameters
   * @returns User's orders
   * @throws {AuthenticationError} If not authenticated
   * @example
   * ```typescript
   * const myOrders = await client.order.getUserOrders({ market_addr: "0x..." });
   * ```
   */
  async getUserOrders(params: ListUserOrdersParams = {}): Promise<OrderResponse[]> {
    this.ensureAuth();
    return this.request<OrderResponse[]>("/user/orders", {}, { auth: true, query: params });
  }

  /**
   * Get authenticated user's fills
   * @param params - Optional filter parameters
   * @returns User's fills
   * @throws {AuthenticationError} If not authenticated
   * @example
   * ```typescript
   * const myFills = await client.order.getUserFills();
   * ```
   */
  async getUserFills(params: ListUserFillsParams = {}): Promise<FillResponse[]> {
    this.ensureAuth();
    return this.request<FillResponse[]>("/user/fills", {}, { auth: true, query: params });
  }

  /**
   * Send a signed intent (order create, cancel, etc.)
   * @param params - Intent parameters with signature
   * @returns Intent response
   * @throws {AuthenticationError} If not authenticated
   * @throws {ValidationError} If parameters are invalid
   * @example
   * ```typescript
   * const response = await client.order.sendIntent({
   *   nonce: Date.now(),
   *   payload: { type: "order_create", orders: [...] },
   *   signature: "0x...",
   * });
   * ```
   */
  async sendIntent(params: SendIntentParams): Promise<SendIntentResponse> {
    this.ensureAuth();
    Validator.validateIntentParams(params);
    return this.request<SendIntentResponse>(
      "/user/intent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      },
      { auth: true }
    );
  }

  /**
   * Send a signed intent and wait for commit
   * @param params - Intent parameters with signature
   * @returns Intent response with commit details
   * @throws {AuthenticationError} If not authenticated
   * @throws {ValidationError} If parameters are invalid
   * @example
   * ```typescript
   * const response = await client.order.sendIntentWithCommit({
   *   nonce: Date.now(),
   *   payload: { type: "order_create", orders: [...] },
   *   signature: "0x...",
   * });
   * console.log(response.sid);
   * ```
   */
  async sendIntentWithCommit(params: SendIntentParams): Promise<SendIntentWithCommitResponse> {
    this.ensureAuth();
    Validator.validateIntentParams(params);
    return this.request<SendIntentWithCommitResponse>(
      "/user/intent/commit",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      },
      { auth: true }
    );
  }
}
