import {
  LeaderboardDataResponse,
  LeaderboardParams,
  UserLeaderboardParams,
} from "./types";

import { BaseHttpClient } from "@/core/base";
import { EkidenClientConfig } from "@/core/config";

export class LeaderboardClient extends BaseHttpClient {
  constructor(config: EkidenClientConfig) {
    super(config);
  }

  async getLeaderboardMy(
    params: UserLeaderboardParams,
  ): Promise<LeaderboardDataResponse> {
    this.ensureAuth();
    return this.request<LeaderboardDataResponse>(
      "/user/leaderboard/my",
      {},
      { auth: true, query: params as any },
    );
  }

  async getLeaderboardAll(
    params: LeaderboardParams,
  ): Promise<LeaderboardDataResponse[]> {
    return this.request<LeaderboardDataResponse[]>(
      "/user/leaderboard/all",
      {},
      { query: params as any },
    );
  }
}
