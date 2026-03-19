const express = require('express');
const router = express.Router();
const axios = require('axios');

let _cache = null;
let _cacheTime = 0;
const CACHE_TTL = 60_000; // 60s

// Pairs with direct KES pricing on Luno
const KES_PAIRS = ['XBTKES', 'ETHKES', 'USDTKES', 'USDCKES'];
// Pairs priced in XBT — we cross-multiply with XBTKES
const XBT_PAIRS = { XRP: 'XRPXBT', SOL: 'SOLXBT', TRX: 'TRXXBT', BCH: 'BCHXBT' };

router.get('/', async (req, res) => {
  if (_cache && Date.now() - _cacheTime < CACHE_TTL) return res.json(_cache);

  try {
    const { data } = await axios.get('https://api.luno.com/api/1/tickers');
    const tickers = data.tickers || [];
    const byPair = {};
    for (const t of tickers) byPair[t.pair] = t;

    const xbtKes = parseFloat(byPair['XBTKES']?.last_trade || 0);

    function kesFromPair(pair) {
      return parseFloat(byPair[pair]?.last_trade || 0);
    }
    function change(pair) {
      // Luno tickers don't include 24h change — return 0
      return 0;
    }
    function xbtCross(xbtPair) {
      const inXbt = parseFloat(byPair[xbtPair]?.last_trade || 0);
      return inXbt * xbtKes;
    }

    _cache = {
      btcKes:    xbtKes,
      btcKesAsk: parseFloat(byPair['XBTKES']?.ask || 0),
      btcKesBid: parseFloat(byPair['XBTKES']?.bid || 0),
      source: 'luno',
      rates: {
        BTC:  { kes: xbtKes,                    change24h: 0 },
        ETH:  { kes: kesFromPair('ETHKES'),      change24h: 0 },
        USDT: { kes: kesFromPair('USDTKES'),     change24h: 0 },
        USDC: { kes: kesFromPair('USDCKES'),     change24h: 0 },
        XRP:  { kes: xbtCross('XRPXBT'),        change24h: 0 },
        SOL:  { kes: xbtCross('SOLXBT'),        change24h: 0 },
        TRX:  { kes: xbtCross('TRXXBT'),        change24h: 0 },
        BCH:  { kes: xbtCross('BCHXBT'),        change24h: 0 },
      },
    };
    _cacheTime = Date.now();
    res.json(_cache);
  } catch (error) {
    console.error('Live rates error:', error.message);
    if (_cache) return res.json({ ..._cache, source: 'cached' });
    res.json({
      btcKes: 9500000, btcKesAsk: 9550000, btcKesBid: 9450000, source: 'fallback',
      rates: {
        BTC:  { kes: 9500000, change24h: 0 },
        ETH:  { kes: 20000,   change24h: 0 },
        USDT: { kes: 133,     change24h: 0 },
        USDC: { kes: 91,      change24h: 0 },
        XRP:  { kes: 310,     change24h: 0 },
        SOL:  { kes: 21000,   change24h: 0 },
        TRX:  { kes: 34,      change24h: 0 },
        BCH:  { kes: 60000,   change24h: 0 },
      },
    });
  }
});

module.exports = router;
