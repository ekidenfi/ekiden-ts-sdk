// Basic example:
// 1. Authenticate (with either prod/staging/local);
// 2. Listen to the private WS account_balance;
// 3. Request funding from faucet;
// 4. Deposit first half of the funds to funding account;
// 5. Deposit second half of the funds to trading account;
// 6. Withdraw funds from funding account;
// 7. Receive balance updates;
//
// Required env: PK=<private_key>
// Optional env: NETWORK=prod/staging/local (default: staging)
//
// Note: Root owner PK (private key) is required.
// Supported private key formats:
// - ed25519-priv-0x960ab8db01222f7307122e4a3284f926e8c06a99a01903eb0b907538829aa7f1
// - 0x960ab8db01222f7307122e4a3284f926e8c06a99a01903eb0b907538829aa7f1
//
// Example:
// - `PK=0x960ab8db01222f7307122e4a3284f926e8c06a99a01903eb0b907538829aa7f1 bun run example/faucet.ts`
// - `PK=0x960ab8db01222f7307122e4a3284f926e8c06a99a01903eb0b907538829aa7f1 NETWORK=local bun run example/faucet.ts`

import { Account, Aptos, AptosConfig, Ed25519PrivateKey, Network } from "@aptos-labs/ts-sdk";
import { buildLinkProof, createSubAccountsDeterministic, EkidenClient } from "../src";
import { auth, SDK_CONFIG } from "./auth";

async function main() {
	const pk = Bun.env.PK;
	if (!pk) {
		console.error("Error: PK environment variable is required (e.g., PK=0x...)");
		process.exit(1);
	}

	// Initialize Clients
	const client = new EkidenClient({
		...SDK_CONFIG,
		privateWSURL: Bun.env.PRIVATE_WS_URL || "ws://localhost:4020/ws/private",
	});

	// Infer network from baseURL or default to local for this example
	const aptosConfig = new AptosConfig({
		network: SDK_CONFIG.baseURL.includes("localhost") ? Network.LOCAL : Network.TESTNET,
	});
	const aptos = new Aptos(aptosConfig);

	try {
		// 1. Authenticate
		console.log("\n--- 1. Authenticating ---");
		const [token, rootAccount] = await auth(pk, client);
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

		// Step 1: Faucet Funding (Get gas and tokens before registration)
		console.log("\n--- 4. Requesting Funding from Faucet ---");
		const fundAmount = 1000 * 10 ** 6; // 1000 USDC
		const fundResult = await client.account.fund({
			receiver: rootAccount.accountAddress.toString(),
			metadatas: [quoteAsset, "0x1::aptos_coin::AptosCoin"],
			amounts: [fundAmount, 100_000_000], // 1000 USDC + 1 APT
		});
		console.log(`Requested ${fundAmount / 1e6} USDC and 1 APT from faucet.`);
		console.log("Waiting for funding transaction to be processed...");
		await aptos.waitForTransaction({ transactionHash: fundResult.txid });
		console.log("Funding confirmed.");

		// 4. WebSocket Subscription
		console.log("\n--- 5. Subscribing to Account Balance Updates ---");
		const unsubscribe = client.privateStream?.subscribeAccountBalance((data) => {
			console.log("[WS] Account Balance Update:", JSON.stringify(data, null, 2));
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
			const fundingAcc = Account.fromPrivateKey({
				privateKey: new Ed25519PrivateKey(funding.privateKey),
			});
			const tradingAcc = Account.fromPrivateKey({
				privateKey: new Ed25519PrivateKey(trading.privateKey),
			});

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

		// 5. Execution
		// Step 2: Deposit to Funding (half)
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

		// Step 3: Deposit to Trading (second half)
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

		// 6. Verification
		console.log("\nWaiting 10 seconds for balance updates...");
		await new Promise((resolve) => setTimeout(resolve, 10000));

		if (unsubscribe) unsubscribe();
		client.close();
		console.log("\nDone.");
	} catch (error) {
		console.error("\nExecution failed:", error instanceof Error ? error.message : error);
		if (error && typeof error === "object" && "data" in error) {
			console.error("Error data:", (error as Error & { data: unknown }).data);
		}
	}
}

if (import.meta.main) {
	await main();
	process.exit(0);
}
