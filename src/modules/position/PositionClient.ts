import { ListPositionsParams, PositionResponse } from "./types";

import { BaseHttpClient } from "@/core/base";
import { EkidenClientConfig } from "@/core/config";

export class PositionClient extends BaseHttpClient {
  constructor(config: EkidenClientConfig) {
    super(config);
  }

  async getUserPositions(
    params: ListPositionsParams = {},
  ): Promise<PositionResponse[]> {
    this.ensureAuth();
    return this.request<PositionResponse[]>(
      "/user/positions",
      {},
      { auth: true, query: params },
    );
  }
}
