import { type Account, AccountAddress, Bool, U64 } from "@aptos-labs/ts-sdk";
import { BaseHttpClient } from "@/core/base";
import { BN } from "@/utils/BigNumber";

export interface WithdrawFromTradingParams {
	addr_from: string;
	addr_to: string;
	amount: string;
	asset_metadata: string;
	nonce: number;
	signature: string;
	timestamp: number;
	withdraw_available: boolean;
}

export class VaultClient extends BaseHttpClient {
	/**
	 * Build and sign withdrawal from trading parameters.
	 *
	 * @param account - Aptos account (sub-account) to sign the request
	 * @param params - Withdrawal parameters (excluding signature and timestamp)
	 * @returns Signed parameters for withdrawFromTrading
	 */
	buildWithdrawFromTradingParams(
		account: Account,
		params: {
			addr_to: string;
			amount: string; // Human readable amount (e.g. "100.0" for 100 USDC)
			asset_metadata: string;
			nonce: number;
			withdraw_available?: boolean;
		}
	): WithdrawFromTradingParams {
		const timestamp = Math.floor(Date.now() / 1000);
		const withdraw_available = params.withdraw_available ?? false;

		// Convert human amount to units (assuming 6 decimals for quote asset)
		// Use simple BigInt multiplication to avoid BN issues in this context
		const amountUnits = BigInt(Math.round(Number.parseFloat(params.amount) * 1_000_000));

		try {
			// Reconstruct signed payload using BCS encoding matching the contract/gateway
			const nonceBytes = new U64(BigInt(params.nonce)).bcsToBytes();
			const addrToBytes = AccountAddress.from(params.addr_to).bcsToBytes();
			const timestampBytes = new U64(BigInt(timestamp)).bcsToBytes();
			const amountBytes = new U64(amountUnits).bcsToBytes();
			const withdrawAvailableBytes = new Bool(withdraw_available).bcsToBytes();

			const messageBytes = new Uint8Array([
				...nonceBytes,
				...addrToBytes,
				...timestampBytes,
				...amountBytes,
				...withdrawAvailableBytes,
			]);

			const signature = account.sign(messageBytes).toString();
			const signatureHex = signature.startsWith("0x") ? signature.slice(2) : signature;

			return {
				addr_from: account.accountAddress.toString(),
				addr_to: params.addr_to,
				amount: params.amount,
				asset_metadata: params.asset_metadata,
				nonce: params.nonce,
				signature: signatureHex,
				timestamp,
				withdraw_available,
			};
		} catch (e) {
			const error = e as Error;
			throw new Error(`Failed to build withdrawal params: ${error.message}`);
		}
	}

	async withdrawFromTrading(params: WithdrawFromTradingParams): Promise<void> {
		this.ensureAuth();
		await this.request(
			"/account/withdraw-from-trading",
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(params),
			},
			{ auth: true }
		);
	}
}
