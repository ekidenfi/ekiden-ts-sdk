import {
  Aptos,
  AptosConfig,
  Ed25519Account,
  Ed25519PrivateKey,
  Network,
} from "@aptos-labs/ts-sdk";

import "dotenv/config";

import { EkidenClient, TESTNET, buildOrderPayload } from "../dist/index.js";

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

async function depositExample() {
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

  const transactionPayload = ekiden.vault.depositIntoUser({
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

  console.log(`Deposit transaction submitted: ${submitted.hash}`);

  // === Optional: After deposit, place an order with TP/SL bracket ===
  try {
    const MARKET_ADDR = process.env.MARKET_ADDR;
    if (!MARKET_ADDR) {
      console.log("Skip placing order with TP/SL: set MARKET_ADDR to enable.");
      return;
    }

    // Authorize trading session
    const timestampMs = Date.now();
    const nonceB64Url = (() => {
      const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
      const raw = String.fromCharCode(...bytes);
      return Buffer.from(raw, "binary").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
    })();
    const authMsg = `AUTHORIZE|${timestampMs}|${nonceB64Url}`;
    const authSig = account.sign(new TextEncoder().encode(authMsg)).toString();
    const tokenResp = await ekiden.httpApi.authorize({
      public_key: account.publicKey.toString(),
      timestamp_ms: timestampMs,
      nonce: nonceB64Url,
      signature: authSig.startsWith("0x") ? authSig : `0x${authSig}`,
    });
    await ekiden.setToken(tokenResp.token);

    // Build an order with TP/SL bracket
    const price = Number(process.env.PRICE || "50000000000");
    const size = Number(process.env.SIZE || "10");
    const leverage = Number(process.env.LEVERAGE || "1");
    const isCross = String(process.env.IS_CROSS || "true").toLowerCase() === "true";
    const tif = process.env.TIF || "PostOnly"; // GTC | IOC | FOK | PostOnly

    const payload = {
      type: "order_create",
      orders: [
        {
          market_addr: MARKET_ADDR,
          side: (process.env.SIDE || "buy").toLowerCase(),
          size,
          price,
          leverage,
          type: "limit",
          is_cross: isCross,
          time_in_force: tif,
          // Optional: conditional trigger price, reduce-only, link id
          // trigger_price: price, // example
          // reduce_only: true,
          // order_link_id: "example-123",
          // TP/SL bracket
          bracket: {
            mode: "FULL",
            take_profit: { trigger_price: Math.max(1, price + Math.floor(price * 0.02)), order_type: "MARKET" },
            stop_loss: { trigger_price: Math.max(1, price - Math.floor(price * 0.02)), order_type: "LIMIT", limit_price: Math.max(1, price - Math.floor(price * 0.02)) },
          },
        },
      ],
    };

    const nonce = Date.now();
    const hex = buildOrderPayload({ payload, nonce });
    const sig = account.sign(Buffer.from(hex.replace(/^0x/, ""), "hex")).toString();

    const res = await ekiden.httpApi.sendIntentWithCommit({
      payload,
      nonce,
      signature: sig.startsWith("0x") ? sig : `0x${sig}`,
    });
    console.log("Placed order with TP/SL:", JSON.stringify(res, null, 2));
  } catch (e) {
    console.warn("Failed to place order with TP/SL:", e?.message || e);
  }
}

depositExample();
