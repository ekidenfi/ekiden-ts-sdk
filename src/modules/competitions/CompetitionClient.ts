import { BaseHttpClient } from "@/core/base";
import type {
	CompetitionLeaderboardParams,
	CompetitionLeaderboardResponse,
	CompetitionPlacementParams,
	CompetitionPlacementResponse,
	CompetitionSummary,
	ListCompetitionsParams,
	ListCompetitionsResponse,
} from "./types";

const competitionPath = (slug: string): string => `/competitions/${encodeURIComponent(slug)}`;
const userCompetitionPath = (slug: string): string =>
	`/user/competitions/${encodeURIComponent(slug)}`;

export class CompetitionClient extends BaseHttpClient {
	async listCompetitions(
		params: ListCompetitionsParams = {}
	): Promise<ListCompetitionsResponse> {
		return this.request<ListCompetitionsResponse>("/competitions", {}, { query: params });
	}

	async getCompetition(slug: string): Promise<CompetitionSummary> {
		return this.request<CompetitionSummary>(competitionPath(slug));
	}

	async getCompetitionLeaderboard(
		slug: string,
		params: CompetitionLeaderboardParams = {}
	): Promise<CompetitionLeaderboardResponse> {
		return this.request<CompetitionLeaderboardResponse>(
			`${competitionPath(slug)}/leaderboard`,
			{},
			{ query: params }
		);
	}

	async getCompetitionPlacement(
		slug: string,
		params: CompetitionPlacementParams = {}
	): Promise<CompetitionPlacementResponse> {
		this.ensureAuth();
		return this.request<CompetitionPlacementResponse>(
			`${userCompetitionPath(slug)}/placement`,
			{},
			{ auth: true, query: params }
		);
	}

}
