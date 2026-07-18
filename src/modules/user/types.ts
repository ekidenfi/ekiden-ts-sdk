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

// -------------------------------------------------------------------------
// Referral (`GET`/`POST /user/referral`)
// -------------------------------------------------------------------------

export interface ReferralSummaryResponse {
	referral_code: string;
	referrer_code?: string | null;
	referrer_user_id?: string | null;
	downline_count: number;
}

export interface BindReferralRequest {
	referral_code: string;
}

// -------------------------------------------------------------------------
// Referral codes (`GET`/`POST /user/referral-codes`, `DELETE .../{id}`) and the
// public click funnel (`POST /referral/click`). Multiple vanity codes per user,
// each carrying its own click/bind funnel counts.
// -------------------------------------------------------------------------

/** Create a vanity referral code. `label` is an optional owner-facing note. */
export interface CreateReferralCodeRequest {
	code: string;
	label?: string | null;
}

/** Record a referral-link click for a code (public, anti-enumeration). */
export interface RecordReferralClickRequest {
	code: string;
}

/** A single referral code owned by the user, with its per-code funnel counts. */
export interface ReferralCodeInfo {
	code_id: string;
	code: string;
	label: string | null;
	/** The user's auto-generated default code; cannot be deleted. */
	is_default: boolean;
	/** Creation time, epoch (integer). */
	created_at: number;
	/** Recorded clicks that resolved to this code. */
	clicks: number;
	/** Users who bound through this specific code. */
	binds: number;
	/** Owner's total direct downline — identical across all of the owner's codes. */
	downline_count: number;
}

export interface ListReferralCodesResponse {
	codes: ReferralCodeInfo[];
}

// -------------------------------------------------------------------------
// Rewards (`GET /user/rewards`) — reshaped: instant XP, ranks, cursor ledger.
//
// Wire conventions: XP amounts are string-encoded integers — consume them with
// the exported `BN` helper (e.g. `new BN(reward.xp_balance)`) rather than
// `Number()` to avoid precision loss. Rates/multipliers are integer basis
// points (bps) where 10000 = 100%: `multiplier_bps: 5000` means +50% (x1.5),
// and a progress fraction is `progress_bps / 10000`.
// -------------------------------------------------------------------------

/**
 * Query params for `GET /user/rewards`. The ledger is cursor-paginated,
 * newest first.
 */
export interface RewardsLedgerParams {
	/** Ledger page size (default 20, max 100). */
	limit?: number;
	/** Opaque cursor from a previous response's `next_cursor`. */
	cursor?: string;
}

/** Rank computed from the XP balance against config thresholds. */
export interface RankStatus {
	name: string;
	/** 0-based index into the configured rank table. */
	index: number;
	/** XP required for the next rank; `null` at the max rank. */
	next_threshold: string | null;
	/**
	 * Progress from the current rank threshold to the next, in bps
	 * (10000 at the max rank). Progress bar = `progress_bps / 10000`.
	 */
	progress_bps: number;
}

/** Lifetime XP per source group. String-encoded integers. */
export interface XpBreakdown {
	taker: string;
	maker: string;
	position: string;
	quest: string;
	referral: string;
}

/** One instant-XP ledger entry. */
export interface RewardsLedgerEntry {
	/**
	 * e.g. `taker_fee`, `maker_fee`, `position_hold`, `quest`,
	 * `referral_l1|l2|l3`, `admin_adjustment` (can be negative),
	 * `stage1_access_bonus`, legacy `weekly_allocation`.
	 */
	reason: string;
	/** String-encoded integer; can be negative for adjustments. */
	delta_xp: string;
	/** RFC 3339 UTC timestamp. */
	created_at: string;
}

/** Referral program status for the viewer as a referrer. */
export interface ReferralStatus {
	/**
	 * Effective L1 cut in bps (base rate, or the Operator rate once the
	 * viewer's balance reaches the Operator threshold).
	 */
	l1_bps_effective: number;
	/** Direct (L1) referrals. */
	downline_count: number;
}

/**
 * Season-1 starting-multiplier block. Present only when the wallet's
 * active-season multiplier is above 1.0x; the whole block is omitted at 1.0x
 * (it is the one OMITTED-when-absent key, not `null`).
 */
export interface SeasonStatus {
	/** Active season label (e.g. `season1`). */
	name: string;
	/** The wallet's Season-1 starting multiplier in bps (always > 0 here). */
	multiplier_bps: number;
	/** The rank-band the multiplier came from, e.g. `operator_band`. */
	source: string;
}

/** `GET /user/rewards` response. */
export interface RewardSummaryResponse {
	xp_balance: string;
	rank: RankStatus;
	/** Vanguard rank and above. */
	closed_tournament_eligible: boolean;
	breakdown: XpBreakdown;
	/** One ledger page, newest first. */
	ledger: RewardsLedgerEntry[];
	/** Cursor for the next ledger page; `null` when this page is the last. */
	next_cursor: string | null;
	referral: ReferralStatus;
	/**
	 * Stage 1 closed-launch badge: true once the wallet has activated an
	 * access code. Cosmetic; false for un-activated wallets.
	 */
	stage1_badge: boolean;
	/** Granted Stage-1 activation multiplier in bps; `null` when un-activated. */
	multiplier_bps: number | null;
	/** Season-1 starting multiplier; omitted entirely at 1.0x. */
	season?: SeasonStatus;
}

// -------------------------------------------------------------------------
// Quests (`GET /user/quests`, `POST /user/quests/{id}/claim`)
// -------------------------------------------------------------------------

/** One active quest with the viewer's claim state. */
export interface UserQuestSummary {
	quest_id: string;
	/** `one_shot` or `daily`. */
	kind: string;
	/** `first_referral_active`, `manual_claim` or `volume_threshold`. */
	trigger: string;
	/** XP paid per claim; string-encoded integer. */
	reward_xp: string;
	/** Quest parameters (e.g. `{ "min_volume_usdc": 1000 }`). */
	params: unknown;
	/**
	 * One-shot quests: ever claimed. Daily quests: claimed for the current
	 * UTC day.
	 */
	claimed: boolean;
	/** RFC 3339 UTC timestamp of the most recent claim, if any. */
	last_claimed_at: string | null;
}

/** `GET /user/quests` response. */
export interface UserQuestsResponse {
	quests: UserQuestSummary[];
}

/** `POST /user/quests/{quest_id}/claim` response: the credited reward. */
export interface ClaimQuestResponse {
	quest_id: string;
	/** XP credited by this claim; string-encoded integer. */
	reward_xp: string;
	/** UTC day the claim is scoped to (daily quests only); `null` otherwise. */
	day: string | null;
}

// -------------------------------------------------------------------------
// Access (`POST /access/activate` public, `GET /user/access` authed)
// -------------------------------------------------------------------------

/**
 * Public Stage 1 activation request. The wallet signs the canonical message
 * `ekiden-stage1-activate:{sha256(normalized code)}:{root_address}:{signed_at}`
 * with the same wallet-signature scheme JWT login uses. The body carries the
 * `public_key` (not the address) — the server derives the address itself.
 */
export interface AccessActivateRequest {
	/** Plaintext access code; normalized (trim + uppercase) server-side. */
	code: string;
	/** Wallet public key, same encoding as `/authorize`'s `public_key`. */
	public_key: string;
	/** Unix seconds at which the message was signed (server window: +/-300s). */
	signed_at: number;
	/** Wallet signature over the canonical activation message. */
	signature: string;
}

export interface AccessActivateResponse {
	activated: boolean;
	multiplier_bps: number;
	badge: boolean;
}

/** `GET /user/access` response: the authenticated wallet's Stage-1 standing. */
export interface AccessStatusResponse {
	/** True once this wallet has activated a closed-launch access code. */
	activated: boolean;
	/** Cosmetic Stage-1 badge; false for un-activated wallets. */
	stage1_badge: boolean;
	/** Granted activation multiplier in bps; `null` when never activated. */
	multiplier_bps: number | null;
	/** Whether a future airdrop allocation is reserved for this wallet. */
	allocation_reserved: boolean;
}

// -------------------------------------------------------------------------
// Affiliate (`GET /user/affiliate`) — 404 for non-affiliates.
// -------------------------------------------------------------------------

/** Positional commission rates in bps. */
export interface AffiliateDashboardRates {
	l1: number;
	l2: number;
	l3: number;
}

/**
 * Affiliate XP-perk multipliers in bps: the perk on the affiliate's own
 * trading XP (`self`) and on their L1 referrals' trading XP (`referrals`).
 */
export interface AffiliateDashboardPerks {
	self: number;
	referrals: number;
}

/** Downline user counts at referral levels 1/2/3 below the affiliate. */
export interface AffiliateDashboardDownline {
	l1: number;
	l2: number;
	l3: number;
}

/** One week of the affiliate's commission history. */
export interface AffiliateDashboardWeek {
	/** RFC 3339 week start (Monday 00:00 UTC). */
	week_start: string;
	/** This week's commission, decimal USDT (e.g. `"412.51"`). */
	amount_usdt: string;
	/** Per-affiliate payout status: `computed` (pending) or `paid`. */
	status: string;
	/** Auditable `{l1,l2,l3}:{fees,bps,amount}` split (micro-USDT integers). */
	breakdown: unknown;
}

/** `GET /user/affiliate` response. Returned only for an affiliate. */
export interface AffiliateDashboardResponse {
	/** Lifecycle status: `active` or `suspended`. */
	status: string;
	rates_bps: AffiliateDashboardRates;
	xp_perks_bps: AffiliateDashboardPerks;
	downline: AffiliateDashboardDownline;
	/** Weekly commission history, newest week first. */
	weeks: AffiliateDashboardWeek[];
	/** Total computed-but-unpaid commission across all weeks, decimal USDT. */
	pending_usdt: string;
}
