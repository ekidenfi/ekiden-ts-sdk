import { BaseHttpClient } from "@/core/base";

export interface LeaderboardEntry {
	account_value: string;
	place: string;
	pnl: string;
	ranked: boolean;
	roi: string;
	sub_account_address: string;
	volume: string;
}

export interface LeaderboardResponse {
	data: LeaderboardEntry[];
}

export type LeaderboardTimeframe = "today" | "7d" | "30d" | "all";

export interface LeaderboardParams {
	timeframe: LeaderboardTimeframe;
	offset?: number;
	limit?: number;
}

export interface LeaderboardPlacementParams {
	timeframe: LeaderboardTimeframe;
	sub_account?: string | null;
}

export class LeaderboardClient extends BaseHttpClient {
	async getLeaderboard(params: LeaderboardParams): Promise<LeaderboardResponse> {
		return this.request<LeaderboardResponse>("/user/leaderboard", {}, { query: params });
	}

	async getLeaderboardPlacement(
		params: LeaderboardPlacementParams
	): Promise<LeaderboardResponse> {
		this.ensureAuth();
		return this.request<LeaderboardResponse>(
			"/user/leaderboard/placement",
			{},
			{ auth: true, query: params }
		);
	}
}
