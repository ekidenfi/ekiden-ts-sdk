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

describe("Aptos testnet live vault deposit_into_funding_with_transfer_to_trading", () => {
  let aptos: Aptos;

  beforeAll(() => {
    aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));
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
    const payload = Vault.depositIntoUserSub({
      subAddress,
      rootAddress,
      signature,
      assetMetadata,
      amount,
      vaultAddress,
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
