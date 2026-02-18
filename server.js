const express = require("express");
const { ethers } = require("ethers");
const pools = require("./pools.json");

const app = express();
const PORT = process.env.PORT || 3000;

const provider = new ethers.JsonRpcProvider("https://node.sidrachain.com");

const ABI = [
  "function getReserves() view returns (uint112,uint112,uint32)"
];

let CACHE = null;
let LAST_UPDATE = 0;

app.get("/pools", async (req, res) => {
  const now = Date.now();

  if (CACHE && now - LAST_UPDATE < 30000) {
    return res.json(CACHE);
  }

  try {
    const results = [];

    for (const pool of pools) {
      const contract = new ethers.Contract(pool.address, ABI, provider);
      const reserves = await contract.getReserves();

      const reserve0 = Number(reserves[0]);
      const reserve1 = Number(reserves[1]);

      const price = reserve1 > 0 ? reserve1 / reserve0 : 0;

      results.push({
        name: pool.name,
        symbol: pool.symbol,
        icon0: pool.icon0,
        icon1: pool.icon1,
        price,
        reserve0,
        reserve1
      });
    }

    CACHE = results;
    LAST_UPDATE = now;

    res.json(results);

  } catch (err) {
    res.status(500).json({ error: "RPC error" });
  }
});

app.listen(PORT, () => {
  console.log("Server running...");
});
