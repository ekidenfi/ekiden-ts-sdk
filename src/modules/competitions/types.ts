export type CompetitionStatus = "draft" | "scheduled" | "active" | "ended" | "cancelled";
export type CompetitionMetric = "volume" | "pnl";

export interface CompetitionScoringConfig {
	metric: CompetitionMetric;
	min_daily_activity_units: number;
	min_active_days: number;
	max_daily_contribution_bps: number;
	start_weight_bps: number;
	end_weight_bps: number;
	use_consistency_multiplier?: boolean;
	consistency_target_days?: number | null;
	consistency_max_bonus_bps?: number | null;
}

export interface CompetitionSummary {
	id: string;
	slug: string;
	title: string;
	status: CompetitionStatus;
	start_time_ms: number;
	end_time_ms: number;
	prize_usdc: number;
	description_md: string;
	symbol?: string | null;
	scoring: CompetitionScoringConfig;
}

export interface ListCompetitionsParams {
	status?: Extract<CompetitionStatus, "scheduled" | "active" | "ended">;
}

export interface ListCompetitionsResponse {
	data: CompetitionSummary[];
}

export interface CompetitionLeaderboardParams {
	offset?: number;
	limit?: number;
	sub_account?: string | null;
}

export interface CompetitionLeaderboardData {
	sub_account_address: string;
	rank?: number | null;
	score: string;
	metric_value: string;
	active_days: number;
	eligible: boolean;
	projected_xp: string;
	ineligible_reason?: string | null;
}

export interface CompetitionLeaderboardMeta {
	offset: number;
	limit: number;
	total: number;
}

export interface CompetitionLeaderboardResponse {
	competition: CompetitionSummary;
	data: CompetitionLeaderboardData[];
	meta: CompetitionLeaderboardMeta;
}

export interface CompetitionPlacementParams {
	sub_account?: string | null;
}

export interface CompetitionPlacementResponse {
	competition: CompetitionSummary;
	data: CompetitionLeaderboardData[];
}
