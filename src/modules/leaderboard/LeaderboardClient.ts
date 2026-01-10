import { BaseHttpClient } from "@/core/base";

export interface LeaderboardEntry {
	place: number;
	wallet: string;
	account_value: number;
	volume: number;
	pnl: number;
	roi: number;
}

export interface LeaderboardParams {
	time_frame: string;
	page?: number;
	per_page?: number;
}

export class LeaderboardClient extends BaseHttpClient {
	async getLeaderboardAll(params: LeaderboardParams): Promise<LeaderboardEntry[]> {
		return this.request<LeaderboardEntry[]>("/leaderboard/all", {}, { query: params });
	}

	async getLeaderboardMy(params: { time_frame: string }): Promise<LeaderboardEntry | null> {
		this.ensureAuth();
		return this.request<LeaderboardEntry | null>(
			"/leaderboard/my",
			{},
			{ auth: true, query: params }
		);
	}
}
