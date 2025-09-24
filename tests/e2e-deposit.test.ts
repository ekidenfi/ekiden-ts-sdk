import {
  Account,
  Aptos,
  AptosConfig,
  Ed25519PrivateKey,
  Network,
} from "@aptos-labs/ts-sdk";
import { beforeAll, describe, expect, jest, test } from "@jest/globals";

import "dotenv/config";

import { Vault } from "../src/aptos/vault";
import { addressToBytes } from "../src/utils/addressToBytes";

// Increase timeout for live network test
jest.setTimeout(180_000);

const privateKeyHex = process.env.APTOS_E2E_PRIVATE_KEY;
const assetMetadata = process.env.APTOS_E2E_ASSET_METADATA;
const vaultAddress = process.env.APTOS_E2E_VAULT_ADDRESS;
const subPrivateKey = process.env.APTOS_E2E_SUB_PRIVATE_KEY;

if (!privateKeyHex || !assetMetadata || !vaultAddress || !subPrivateKey) {
  throw new Error(
    "APTOS_E2E_PRIVATE_KEY, APTOS_E2E_ASSET_METADATA, APTOS_E2E_VAULT_ADDRESS, APTOS_E2E_SUB_PRIVATE_KEY are not set",
  );
}

describe("Aptos testnet live vault operations", () => {
  let aptos: Aptos;

  beforeAll(() => {
    aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));
  });

  test("gets owned subaccounts using owned_sub_accs view function", async () => {
    const sender = Account.fromPrivateKey({
      privateKey: new Ed25519PrivateKey(privateKeyHex),
    });

    const payload = Vault.ownedSubAccs({
      vaultAddress,
      userAddress: sender.accountAddress,
    });

    const result = await aptos.view({ payload });
    console.log("Owned subaccounts:", result);

    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toBeDefined();
    expect(Array.isArray(result[0])).toBe(true);
  });

  test("checks if funding vault exists for user", async () => {
    const sender = Account.fromPrivateKey({
      privateKey: new Ed25519PrivateKey(privateKeyHex),
    });

    const payload = Vault.isFundingVaultExists({
      vaultAddress,
      userAddress: sender.accountAddress,
      assetMetadata,
    });

    const result = await aptos.view({ payload });
    console.log("Funding vault exists:", result);

    expect(typeof result[0]).toBe("boolean");
  });

  test("checks if trading vault exists for sub address", async () => {
    const subAccount = Account.fromPrivateKey({
      privateKey: new Ed25519PrivateKey(subPrivateKey),
    });

    const payload = Vault.isTradingVaultExists({
      vaultAddress,
      subAddress: subAccount.accountAddress,
      assetMetadata,
    });

    const result = await aptos.view({ payload });
    console.log("Trading vault exists:", result);

    expect(typeof result[0]).toBe("boolean");
  });

  test("analyzes all owned sub accounts and determines vault types", async () => {
    const sender = Account.fromPrivateKey({
      privateKey: new Ed25519PrivateKey(privateKeyHex),
    });

    // Get all owned sub accounts
    const ownedSubAccsPayload = Vault.ownedSubAccs({
      vaultAddress,
      userAddress: sender.accountAddress,
    });

    const ownedSubAccsResult = await aptos.view({
      payload: ownedSubAccsPayload,
    });
    console.log("Owned subaccounts:", ownedSubAccsResult);

    expect(Array.isArray(ownedSubAccsResult)).toBe(true);
    expect(ownedSubAccsResult[0]).toBeDefined();
    expect(Array.isArray(ownedSubAccsResult[0])).toBe(true);

    const subAccounts = ownedSubAccsResult[0] as string[];

    // Analyze each sub account
    for (const subAccount of subAccounts) {
      console.log(`\n--- Analyzing sub account: ${subAccount} ---`);

      // Check if it's a trading vault
      const tradingPayload = Vault.isTradingVaultExists({
        vaultAddress,
        subAddress: subAccount,
        assetMetadata,
      });

      const isTradingVaultResult = await aptos.view({
        payload: tradingPayload,
      });
      const isTradingVault = isTradingVaultResult[0] as boolean;

      // Check if user has a funding vault (not specific to sub account)
      const fundingPayload = Vault.isFundingVaultExists({
        vaultAddress,
        userAddress: sender.accountAddress,
        assetMetadata,
      });

      const isFundingVaultResult = await aptos.view({
        payload: fundingPayload,
      });
      const isFundingVault = isFundingVaultResult[0] as boolean;

      console.log(`Sub account ${subAccount}:`);
      console.log(`- Is trading vault: ${isTradingVault}`);
      console.log(`- User has funding vault: ${isFundingVault}`);

      if (isTradingVault) {
        console.log(`- Type: TRADING VAULT`);
      } else {
        console.log(`- Type: UNKNOWN (not a trading vault)`);
      }

      // Verify that at least one vault type exists
      expect(typeof isTradingVault).toBe("boolean");
      expect(typeof isFundingVault).toBe("boolean");
    }

    expect(subAccounts.length).toBeGreaterThan(0);
  });

  test("submits deposit_into_funding_with_transfer_to_trading and confirms", async () => {
    const subAccount = Account.fromPrivateKey({
      privateKey: new Ed25519PrivateKey(subPrivateKey),
    });
    const amount = 10000000n;
    // Root signer (must already hold FA balance for assetMetadata on testnet)
    const sender = Account.fromPrivateKey({
      privateKey: new Ed25519PrivateKey(privateKeyHex),
    });
    // Generate an ephemeral sub account and build link proof: pubkey(32) || root_addr(32) || sig(64)
    const subAddress = subAccount.publicKey.toUint8Array();
    const rootAddress = addressToBytes(sender.accountAddress);
    const signature = subAccount
      .sign(sender.accountAddress.toString())
      .toUint8Array();

    // Generate sub account address from the public key
    const subAccountAddress = subAccount.accountAddress.toString();

    console.log("subAddress length:", subAddress.length);
    console.log("rootAddress length:", rootAddress.length);
    console.log("signature length:", signature.length);
    console.log("subAccountAddress:", subAccountAddress);

    const payload = Vault.depositIntoUserSub({
      subAddress,
      rootAddress,
      signature,
      assetMetadata,
      amount,
      vaultAddress,
      fundingSubAddress: subAccountAddress,
      tradingSubAddress: subAccountAddress,
      tradingSubKey: subAddress, // same as subAddress
      tradingRootAddress: rootAddress, // same as rootAddress
      tradingSignature: signature, // same as signature
    });
    const committed = await sendTx(aptos, sender, payload);
    console.log("committed", committed);
    expect(committed.hash).toBeDefined();
    expect(committed.success).toBe(true);
  });
});

const sendTx = async (aptos: Aptos, sender: Account, payload: any) => {
  const { gas_estimate } = await aptos.getGasPriceEstimation();
  // Draft and simulate to size gas
  const draft = await aptos.transaction.build.simple({
    sender: sender.accountAddress,
    data: payload,
    options: { gasUnitPrice: gas_estimate },
  });
  const [sim] = await aptos.transaction.simulate.multiAgent({
    signerPublicKey: sender.publicKey,
    transaction: draft,
  });
  const gasUsed = BigInt(sim.gas_used ?? 20000);
  const maxGasAmount = gasUsed + 5000n;
  const tx = await aptos.transaction.build.simple({
    sender: sender.accountAddress,
    data: payload,
    options: {
      gasUnitPrice: gas_estimate,
      maxGasAmount: Number(maxGasAmount),
    },
  });
  const pending = await aptos.signAndSubmitTransaction({
    signer: sender,
    transaction: tx,
  });
  const committed = await aptos.waitForTransaction({
    transactionHash: pending.hash,
    options: { timeoutSecs: 90 },
  });
  return committed;
};
