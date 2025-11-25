import {
  Aptos,
  AptosConfig,
  Ed25519Account,
  Ed25519PrivateKey,
  Network,
} from "@aptos-labs/ts-sdk";

import "dotenv/config";

import { EkidenClient, TESTNET } from "../dist/index.js";

const TESTNET_USDC =
  "0x9967e130f7419f791c240acc17dde966ec84ad41652e2e87083ee613f460d019";

const TESTNET_VAULT_ADDRESS =
  "0x9e53ba9771421bddb0ba8722cde10b8c6a933dba8557075610698a95b8a82ec6";

const config = {
  privateKey: process.env["PK"], // Replace with your private key
  vaultAddress: TESTNET_VAULT_ADDRESS,
  assetMetadata: TESTNET_USDC,
  amount: BigInt(1000000), // 1 USDC (1e6)
};

async function withdrawExample() {
  const ekiden = new EkidenClient({
    baseURL: TESTNET.baseURL,
    apiPrefix: TESTNET.apiPrefix,
  });
  const aptosConfig = new AptosConfig({ network: Network.TESTNET });
  const aptos = new Aptos(aptosConfig);

  const privateKey = new Ed25519PrivateKey(config.privateKey);
  const account = new Ed25519Account({ privateKey });

  const bal = await aptos.getAccountAPTAmount({
    accountAddress: account.accountAddress.toString(),
  });

  const transactionPayload = ekiden.vault.requestWithdrawFromUser({
    vaultAddress: config.vaultAddress,
    assetMetadata: config.assetMetadata,
    amount: config.amount,
  });

  const { gas_estimate } = await aptos.getGasPriceEstimation();

  const draft = await aptos.transaction.build.simple({
    sender: account.accountAddress,
    data: transactionPayload,
    options: { gasUnitPrice: gas_estimate },
  });

  const [sim] = await aptos.transaction.simulate.simple({
    signerPublicKey: account.publicKey,
    transaction: draft,
  });

  const gasUsed = BigInt(sim.gas_used ?? 20000);
  const maxGasAmount = gasUsed + 5000n;

  const tx = await aptos.transaction.build.simple({
    sender: account.accountAddress,
    data: transactionPayload,
    options: {
      gasUnitPrice: gas_estimate,
      maxGasAmount, // bigint!
    },
  });

  const auth = aptos.transaction.sign({ signer: account, transaction: tx });
  const submitted = await aptos.transaction.submit.simple({
    transaction: tx,
    senderAuthenticator: auth,
  });
  await aptos.waitForTransaction({ transactionHash: submitted.hash });
}

withdrawExample();
