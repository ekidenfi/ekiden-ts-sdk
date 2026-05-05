export type {
	ApiKeyInfo,
	ApiKeyScope,
	AuthorizeRequest,
	AuthorizeResponse,
	CreateApiKeyRequest,
	CreateApiKeyResponse,
	GetRootAccountResponse,
	GetSubAccountsResponse,
	ListApiKeysResponse,
	UserId,
} from "@/types/api";

export interface RewardHistoryParams {
	limit?: number;
}

export interface PointsLedgerEntry {
	ledger_id: string;
	run_id: string;
	delta_xp: number;
	reason: string;
	metadata_json: unknown;
	created_at: number;
}

export interface RewardWeekSummary {
	week_start: number;
	week_end: number;
	own_ps: string;
	bonus_ps: string;
	final_ps: string;
	xp: string;
	finalized: boolean;
}

export interface RewardSummaryResponse {
	current_week: RewardWeekSummary;
	history: RewardWeekSummary[];
	xp_balance: number;
	ledger: PointsLedgerEntry[];
}
