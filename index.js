const express = require("express");
const axios = require("axios");
const https = require("https");
const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

// ✅ טיפול ב-GET / כדי למנוע 404
app.get("/", (req, res) => {
  res.status(200).send("✅ ArbiBot API is alive");
});

const coinsList = [
  "ETH",
  "SOL",
  "ADA",
  "XRP",
  "DOGE",
  "LTC",
  "DOT",
  "AVAX",
  "MATIC",
  "BCH",
  "LINK",
  "TRX",
  "ETC",
  "ATOM",
  "ALGO",
  "EOS",
  "FIL",
  "UNI",
  "XLM",
  "NEAR",
  "ICP",
  "XMR",
  "AAVE",
  "SAND",
  "CHZ",
  "FTM",
  "GRT",
  "COMP",
  "RNDR",
  "LDO",
  "CRV",
  "SNX",
  "KAVA",
];

const symbolMap = {
  Kraken: Object.fromEntries(coinsList.map((c) => [c, `${c}USD`])),
  MEXC: Object.fromEntries(coinsList.map((c) => [c, `${c}USDT`])),
  KuCoin: Object.fromEntries(coinsList.map((c) => [c, `${c}-USDT`])),
  Bitget: Object.fromEntries(
    coinsList.map((c) => [c, `${c.toLowerCase()}usdt_spbl`]),
  ),
  CoinEx: Object.fromEntries(
    coinsList.map((c) => [c, `${c.toUpperCase()}USDT`]),
  ),
  Coinbase: Object.fromEntries(coinsList.map((c) => [c, `${c}-USD`])),
  Bitfinex: Object.fromEntries(
    coinsList.map((c) => [c, `t${c.toUpperCase()}USD`]),
  ),
  OKX: Object.fromEntries(coinsList.map((c) => [c, `${c.toUpperCase()}-USDT`])),
  AscendEX: Object.fromEntries(coinsList.map((c) => [c, `${c}/USDT`])),
};

async function fetchPrice(platform, symbol) {
  if (!symbol || symbol === "-") return 0;
  try {
    let url = "";
    switch (platform) {
      case "Kraken":
        url = `https://api.kraken.com/0/public/Ticker?pair=${symbol}`;
        const resKraken = await axios.get(url);
        const key = Object.keys(resKraken.data.result)[0];
        return parseFloat(resKraken.data.result[key].c[0]);
      case "MEXC":
        url = `https://api.mexc.com/api/v3/ticker/price?symbol=${symbol}`;
        const resMEXC = await axios.get(url);
        return parseFloat(resMEXC.data.price);
      case "KuCoin":
        url = `https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=${symbol}`;
        const resKuCoin = await axios.get(url);
        return parseFloat(resKuCoin.data.data.price);
      case "Bitget":
        url = `https://api.bitget.com/api/spot/v1/market/ticker?symbol=${symbol}`;
        const resBitget = await axios.get(url);
        return parseFloat(resBitget.data.data.close);
      case "CoinEx":
        url = `https://api.coinex.com/v1/market/ticker?market=${symbol}`;
        const resCoinEx = await axios.get(url);
        return parseFloat(resCoinEx.data.data.ticker.last);
      case "Coinbase":
        url = `https://api.coinbase.com/v2/prices/${symbol}/spot`;
        const resCoinbase = await axios.get(url);
        return parseFloat(resCoinbase.data.data.amount);
      case "Bitfinex":
        url = `https://api-pub.bitfinex.com/v2/ticker/${symbol}`;
        const resBitfinex = await axios.get(url);
        return parseFloat(resBitfinex.data[6]);
      case "OKX":
        url = `https://www.okx.com/api/v5/market/ticker?instId=${symbol}`;
        const resOKX = await axios.get(url);
        return parseFloat(resOKX.data.data[0].last);
      case "AscendEX":
        url = `https://ascendex.com/api/pro/v1/ticker?symbol=${symbol}`;
        const resAscend = await axios.get(url);
        return parseFloat(resAscend.data.data.close);
      default:
        return 0;
    }
  } catch (e) {
    console.log(`❌ ${platform} ${symbol}: ${e.message}`);
    return 0;
  }
}

let cachedData = null;
let lastUpdated = 0;

async function updateCache() {
  const platforms = Object.keys(symbolMap);
  const result = {};

  for (let coin of coinsList) {
    result[coin] = {};
    for (let platform of platforms) {
      const symbol = symbolMap[platform]?.[coin] || "-";
      const price = await fetchPrice(platform, symbol);
      result[coin][platform] = price;
    }
  }

  cachedData = result;
  lastUpdated = Date.now();
  console.log("🔄 Cache updated at", new Date().toLocaleTimeString());
}

// ⏱️ עדכון קאש כל דקה
setInterval(updateCache, 60000);

// ✅ נקודת גישה למחירים
app.get("/prices", async (req, res) => {
  if (!cachedData) {
    await updateCache();
  }
  res.json(cachedData);
});

// ⏳ שמירה על השרת ער ע"י שליחה עצמית כל 4 דקות
setInterval(
  () => {
    https
      .get(
        "https://c71c8fe8-ef6b-4a9d-abe4-196b12126142-00-1bo1lr2xh1wiu.picard.replit.dev",
        (res) => {
          console.log("🔁 Self-ping sent.");
        },
      )
      .on("error", (e) => {
        console.error("Ping failed:", e);
      });
  },
  4 * 60 * 1000,
);

// 🚀 התחלת השרת
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
