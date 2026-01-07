import { EkidenClient } from "../src";

const client = new EkidenClient({
  baseURL: "http://localhost:4020",
  apiPrefix: "/api/v1",
  contractAddress: "",
});

async function main() {
  console.log("Testing connection to local backend at http://localhost:4020\n");

  // Test 1: System Info
  console.log("1. Testing getSystemInfo()...");
  try {
    const systemInfo = await client.system.getSystemInfo();
    console.log("   ✅ System Info:", JSON.stringify(systemInfo, null, 2));
  } catch (error: any) {
    console.log("   ❌ Error:", error.message);
  }

  // Test 2: Get Tickers
  console.log("\n2. Testing getTickers()...");
  try {
    const tickers = await client.market.getTickers();
    console.log("   ✅ Tickers:", JSON.stringify(tickers, null, 2));
  } catch (error: any) {
    console.log("   ❌ Error:", error.message);
  }

  // Test 3: Get Markets
  console.log("\n3. Testing getMarkets()...");
  try {
    const markets = await client.market.getMarkets();
    console.log("   ✅ Markets count:", markets.length);
    if (markets.length > 0) {
      console.log("   First market:", markets[0].symbol);
    }
  } catch (error: any) {
    console.log("   ❌ Error:", error.message);
  }

  // Test 4: Get Orderbook (if markets exist)
  console.log("\n4. Testing getOrderbook()...");
  try {
    const markets = await client.market.getMarkets();
    if (markets.length > 0) {
      const symbol = markets[0].symbol;
      const orderbook = await client.market.getOrderbook({ symbol });
      console.log(`   ✅ Orderbook for ${symbol}:`, JSON.stringify(orderbook, null, 2));
    } else {
      console.log("   ⚠️  No markets available to test orderbook");
    }
  } catch (error: any) {
    console.log("   ❌ Error:", error.message);
  }

  // Test 5: Get Recent Trades
  console.log("\n5. Testing getRecentTrades()...");
  try {
    const markets = await client.market.getMarkets();
    if (markets.length > 0) {
      const symbol = markets[0].symbol;
      const trades = await client.market.getRecentTrades({ symbol });
      console.log(`   ✅ Recent trades for ${symbol}:`, JSON.stringify(trades, null, 2));
    } else {
      console.log("   ⚠️  No markets available to test recent trades");
    }
  } catch (error: any) {
    console.log("   ❌ Error:", error.message);
  }

  // Test 6: Get Risk Limit
  console.log("\n6. Testing getRiskLimit()...");
  try {
    const riskLimit = await client.market.getRiskLimit();
    console.log("   ✅ Risk Limit:", JSON.stringify(riskLimit, null, 2));
  } catch (error: any) {
    console.log("   ❌ Error:", error.message);
  }

  console.log("\n✨ Tests completed!");
}

main().catch(console.error);
