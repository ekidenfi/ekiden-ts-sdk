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

export interface ReferralSummaryResponse {
	referral_code: string;
	referrer_code?: string | null;
	referrer_user_id?: string | null;
	downline_count: number;
}

export interface BindReferralRequest {
	referral_code: string;
}

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
	/**
	 * Canton Console (self-custody) party id (`<hint>::<fingerprint>`). Present on
	 * the Console path; the server verifies `signature` over the code-bound
	 * `EKIDEN-CANTON-ACTIVATE` challenge and that `public_key` controls it.
	 */
	party_id?: string;
	/** Anti-replay nonce bound into the Canton Console activation challenge. */
	nonce?: string;
	/**
	 * Auth0/Google OIDC `id_token` for the custodial path. When present the server
	 * reads the Canton party from the token — no client signature is required
	 * (`public_key`/`signature` are ignored on this path).
	 */
	id_token?: string;
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
	/**
	 * Whether a future airdrop allocation is reserved for this wallet. Added by
	 * Stage-2 (Season-1 conversion); **absent** on the Stage-1-only access-gate
	 * deploy, so treat as optional and default to `false` when missing.
	 */
	allocation_reserved?: boolean;
}
