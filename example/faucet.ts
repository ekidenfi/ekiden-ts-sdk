// Comprehensive integration example:
// 1. Authenticate (REST + Private WebSocket);
// 2. Fetch system info (metadatas and addresses);
// 3. Setup sub-accounts deterministically;
// 4. Request funding from faucet (Gas + Tokens);
// 5. Subscribe to balance updates;
// 6. Perform on-chain registration (if needed);
// 7. Deposit funds to funding account;
// 8. Deposit funds to trading account via transfer;
// 9. Withdraw from trading to funding (REST API);
// 10. Withdraw from funding to root wallet (On-chain);
// 11. Receive balance updates and exit.
//
// Required env: PK=<private_key>
// Optional env: NETWORK=prod/staging/dev/local (default: staging)
//
// Note: Root owner PK (private key) is required.
// Supported private key formats:
// - ed25519-priv-0x960ab8db01222f7307122e4a3284f926e8c06a99a01903eb0b907538829aa7f1
// - 0x960ab8db01222f7307122e4a3284f926e8c06a99a01903eb0b907538829aa7f1
//
// Example:
// - `PK=0x960ab8db01222f7307122e4a3284f926e8c06a99a01903eb0b907538829aa7f1 bun run example/faucet.ts`
// - `PK=0x960ab8db01222f7307122e4a3284f926e8c06a99a01903eb0b907538829aa7f1 NETWORK=dev bun run example/faucet.ts`
// - `PK=0x960ab8db01222f7307122e4a3284f926e8c06a99a01903eb0b907538829aa7f1 NETWORK=local bun run example/faucet.ts`

import {
	Account,
	Aptos,
	AptosConfig,
	Ed25519PrivateKey,
	Network,
	PrivateKey,
	PrivateKeyVariants,
} from "@aptos-labs/ts-sdk";
import { buildLinkProof, createSubAccountsDeterministic, EkidenClient } from "../src";
import { auth, SDK_CONFIG } from "./auth";

async function main() {
	const pk = Bun.env.PK;
	if (!pk) {
		console.error("Error: PK environment variable is required (e.g., PK=0x...)");
		process.exit(1);
	}

	// Initialize Clients
	const client = new EkidenClient(SDK_CONFIG);

	// Infer network from baseURL or default to local for this example
	const isLocal = SDK_CONFIG.baseURL.includes("localhost");
	const aptosConfig = new AptosConfig({
		network: isLocal ? Network.LOCAL : Network.TESTNET,
	});
	const aptos = new Aptos(aptosConfig);

	try {
		// 1. Authenticate
		console.log("\n--- 1. Authenticating ---");
		// Format PK to be AIP-80 compliant to avoid SDK warnings/instability
		const compliantPk = PrivateKey.formatPrivateKey(pk, PrivateKeyVariants.Ed25519);
		const [token, rootAccount] = await auth(compliantPk, client);
		await client.setTokens({ rest: token, ws: token, connectPrivateWS: true });
		console.log("Authenticated and Private WS connected.");

		// 2. Fetch System Info
		console.log("\n--- 2. Fetching System Info ---");
		const systemInfo = await client.system.getSystemInfo();
		const quoteAsset = systemInfo.quote_asset_metadata;
		console.log(`Quote Asset: ${quoteAsset}`);
		console.log(`Perpetual Contract: ${systemInfo.perpetual_addr}`);

		// Update client with correct contract address for on-chain calls
		client.config.contractAddress = systemInfo.perpetual_addr;

		// 3. Account Management
		console.log("\n--- 3. Setting up Sub-Accounts ---");
		const { funding, trading } = await createSubAccountsDeterministic(
			rootAccount.accountAddress.toString()
		);
		console.log(`Funding Sub-Account: ${funding.address}`);
		console.log(`Trading Sub-Account: ${trading.address}`);

		const fundingAcc = Account.fromPrivateKey({
			privateKey: new Ed25519PrivateKey(funding.privateKey),
		});
		const tradingAcc = Account.fromPrivateKey({
			privateKey: new Ed25519PrivateKey(trading.privateKey),
		});

		// Step 1: Faucet Funding (Get gas and tokens before registration)
		console.log("\n--- 4. Requesting Funding from Faucet ---");
		const fundAmount = 500 * 10 ** 6; // 500 USDC
		const fundResult = await client.account.fund({
			receiver: rootAccount.accountAddress.toString(),
			metadatas: [quoteAsset, "0x1::aptos_coin::AptosCoin"],
			amounts: [fundAmount, 100_000_000], // 500 USDC + 1 APT
		});
		console.log(`Requested ${fundAmount / 1e6} USDC and 1 APT from faucet.`);

		if (fundResult.txid === "accepted") {
			console.log("Funding request accepted by faucet queue. Waiting for balance update...");
			// Wait for balance to increase (at least 0.5 APT buffer)
			let funded = false;
			for (let i = 0; i < 30; i++) {
				const currentBalance = await aptos.getAccountAPTAmount({
					accountAddress: rootAccount.accountAddress,
				});
				if (Number(currentBalance) >= 50_000_000) {
					funded = true;
					break;
				}
				await new Promise((resolve) => setTimeout(resolve, 2000));
			}
			if (!funded) {
				throw new Error("Timed out waiting for faucet funding");
			}
		} else {
			console.log("Waiting for funding transaction to be processed...");
			await aptos.waitForTransaction({ transactionHash: fundResult.txid });
		}
		console.log("Funding confirmed.");

		// Verify balance
		const finalBalance = await aptos.getAccountAPTAmount({
			accountAddress: rootAccount.accountAddress,
		});
		console.log(`Root account balance: ${Number(finalBalance) / 1e8} APT`);

		// Step 5: Subscribe to Balance Updates (Before activity starts)
		console.log("\n--- 5. Subscribing to Account Balance Updates ---");
		const unsubscribe = client.privateStream?.subscribeAccountBalance((data) => {
			const type = data.account_type || "unknown";
			const balance = data.available_balance ?? "0";
			console.log(`[WS] Balance Update for ${type}: ${balance}`);
		});

		// Check registration via on-chain view function
		console.log("\n--- 6. Checking Registration ---");
		const viewResult = await aptos.view({
			payload: {
				function: `${systemInfo.perpetual_addr}::user::is_ekiden_user`,
				functionArguments: [rootAccount.accountAddress.toString()],
			},
		});
		let isRegistered = viewResult[0] as boolean;

		if (isRegistered) {
			console.log("User already registered.");
		} else {
			console.log("User not registered, performing on-chain registration...");

			const fundingLinkProof = buildLinkProof(
				fundingAcc.publicKey.toUint8Array(),
				rootAccount.accountAddress.toString(),
				fundingAcc.sign(rootAccount.accountAddress.toUint8Array()).toUint8Array()
			);

			const tradingLinkProof = buildLinkProof(
				tradingAcc.publicKey.toUint8Array(),
				rootAccount.accountAddress.toString(),
				tradingAcc.sign(rootAccount.accountAddress.toUint8Array()).toUint8Array()
			);

			const payload = client.vaultOnChain.createEkidenUser({
				vaultAddress: systemInfo.perpetual_addr,
				fundingLinkProof,
				crossTradingLinkProof: tradingLinkProof,
			});

			console.log("Submitting registration transaction...");
			const tx = await aptos.transaction.build.simple({
				sender: rootAccount.accountAddress,
				data: payload as any,
			});
			const senderAuthenticator = aptos.transaction.sign({
				signer: rootAccount,
				transaction: tx,
			});
			const committedTx = await aptos.transaction.submit.simple({
				transaction: tx,
				senderAuthenticator,
			});
			await aptos.waitForTransaction({ transactionHash: committedTx.hash });
			console.log(`Registration successful: ${committedTx.hash}`);
			isRegistered = true;
		}

		// Step 7: Deposit to Funding (half)
		const depositAmount = BigInt(fundAmount / 2);
		console.log(
			`\n--- 7. Depositing ${Number(depositAmount) / 1e6} USDC to Funding Account ---`
		);
		const depositFundingPayload = client.vaultOnChain.depositIntoFunding({
			subAddress: funding.address,
			assetMetadata: quoteAsset,
			amount: depositAmount,
		});

		const tx1 = await aptos.transaction.build.simple({
			sender: rootAccount.accountAddress,
			data: depositFundingPayload as any,
		});
		const auth1 = aptos.transaction.sign({ signer: rootAccount, transaction: tx1 });
		const committedTx1 = await aptos.transaction.submit.simple({
			transaction: tx1,
			senderAuthenticator: auth1,
		});
		await aptos.waitForTransaction({ transactionHash: committedTx1.hash });
		console.log(`Deposit to Funding successful: ${committedTx1.hash}`);

		// Step 8: Deposit to Trading (second half)
		console.log(
			`\n--- 8. Depositing ${Number(depositAmount) / 1e6} USDC to Trading Account via Transfer ---`
		);
		const depositTradingPayload = client.vaultOnChain.depositIntoFundingWithTransferTo({
			vaultAddress: systemInfo.perpetual_addr,
			fundingSubAddress: funding.address,
			tradingSubAddress: trading.address,
			assetMetadata: quoteAsset,
			amount: depositAmount,
			vaultToType: "Cross",
		});

		const tx2 = await aptos.transaction.build.simple({
			sender: rootAccount.accountAddress,
			data: depositTradingPayload as any,
		});
		const auth2 = aptos.transaction.sign({ signer: rootAccount, transaction: tx2 });
		const committedTx2 = await aptos.transaction.submit.simple({
			transaction: tx2,
			senderAuthenticator: auth2,
		});
		await aptos.waitForTransaction({ transactionHash: committedTx2.hash });
		console.log(`Deposit to Trading successful: ${committedTx2.hash}`);

		// Wait for the vault to be indexed by the gateway
		console.log("Waiting for vault to be indexed by the gateway...");
		let indexed = false;
		for (let i = 0; i < 30; i++) {
			try {
				const balances = await client.account.getBalance();
				const hasVault = balances.list.some(
					(b) => b.sub_account_address === trading.address
				);
				if (hasVault) {
					indexed = true;
					break;
				}
			} catch (e) {
				// Ignore errors and retry
			}
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
		if (!indexed) {
			console.warn("Warning: Vault not yet visible in gateway balances, but proceeding...");
		}

		// Step 9: Withdraw from Trading back to Funding
		console.log(
			`\n--- 9. Withdrawing ${Number(depositAmount) / 1e6} USDC from Trading to Funding ---`
		);

		// Wait for the trading sub-account to be active on-chain
		console.log("Waiting for trading sub-account to be active on-chain...");
		let activeOnChain = false;
		for (let i = 0; i < 15; i++) {
			try {
				await aptos.view({
					payload: {
						function: `${systemInfo.perpetual_addr}::user::get_sub_acc`,
						functionArguments: [trading.address],
					},
				});
				activeOnChain = true;
				break;
			} catch (e) {
				await new Promise((resolve) => setTimeout(resolve, 2000));
			}
		}

		if (!activeOnChain) throw new Error("Sub-account failed to activate on-chain");

		// Get current nonce for trading sub-account
		const tradingSubAccInfo = (await aptos.view({
			payload: {
				function: `${systemInfo.perpetual_addr}::user::get_sub_acc`,
				functionArguments: [trading.address],
			},
		})) as any[];

		// Robust nonce parsing: handle both flat and nested arrays from view result
		let nonceStr: string;
		if (Array.isArray(tradingSubAccInfo[0]) && tradingSubAccInfo[0].length >= 6) {
			nonceStr = tradingSubAccInfo[0][5] as string;
		} else {
			nonceStr = tradingSubAccInfo[5] as string;
		}

		const nonce = Number.parseInt(nonceStr, 10);
		console.log(`Current nonce for trading sub-account: ${nonce} (raw: ${nonceStr})`);

		if (Number.isNaN(nonce)) {
			throw new Error(
				`Failed to parse nonce from view result: ${JSON.stringify(tradingSubAccInfo)}`
			);
		}

		const withdrawParams = client.vault.buildWithdrawFromTradingParams(tradingAcc, {
			addr_to: funding.address,
			amount: (Number(depositAmount) / 1e6).toString(),
			asset_metadata: quoteAsset,
			nonce,
		});

		await client.vault.withdrawFromTrading(withdrawParams);
		console.log("Withdrawal from Trading initiated successfully.");

		// Step 10: Withdraw from Funding back to Wallet (On-chain)
		console.log(
			`\n--- 10. Withdrawing ${Number(depositAmount) / 1e6} USDC from Funding back to Wallet ---`
		);
		const withdrawFundingPayload = client.vaultOnChain.withdrawFromFunding({
			subAddress: funding.address,
			assetMetadata: quoteAsset,
			amount: depositAmount,
		});

		const tx3 = await aptos.transaction.build.simple({
			sender: rootAccount.accountAddress,
			data: withdrawFundingPayload as any,
		});
		const auth3 = aptos.transaction.sign({ signer: rootAccount, transaction: tx3 });
		const committedTx3 = await aptos.transaction.submit.simple({
			transaction: tx3,
			senderAuthenticator: auth3,
		});
		await aptos.waitForTransaction({ transactionHash: committedTx3.hash });
		console.log(`Withdraw from Funding successful: ${committedTx3.hash}`);

		// Step 11: Verification & Final Balance Updates
		console.log("\n--- 11. Final Verification ---");
		console.log("Waiting 5 seconds for final balance updates via WS...");
		await new Promise((resolve) => setTimeout(resolve, 5000));

		if (unsubscribe) unsubscribe();
		client.close();
		console.log("\nDone.");
	} catch (error) {
		console.error("\nExecution failed:");
		if (error instanceof Error) {
			console.error(`Message: ${error.message}`);
			if ("statusCode" in error) {
				console.error(`Status Code: ${(error as any).statusCode}`);
			}
			if ("endpoint" in error) {
				console.error(`Endpoint: ${(error as any).endpoint}`);
			}
		} else {
			console.error(error);
		}

		if (error && typeof error === "object" && "data" in error) {
			console.error("Error data:", (error as any).data);
		}
	}
}

if (import.meta.main) {
	await main();
	process.exit(0);
}
