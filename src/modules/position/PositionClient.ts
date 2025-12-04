import type { ListPositionsParams, PositionResponse } from "./types";

import { BaseHttpClient } from "@/core/base";

export class PositionClient extends BaseHttpClient {
  async getUserPositions(params: ListPositionsParams = {}): Promise<PositionResponse[]> {
    this.ensureAuth();
    return this.request<PositionResponse[]>("/user/positions", {}, { auth: true, query: params });
  }
}
