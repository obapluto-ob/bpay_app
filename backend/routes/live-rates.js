const express = require('express');
const router = express.Router();

const https = require('https');

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (r) => {
      let body = '';
      r.on('data', c => body += c);
      r.on('end', () => resolve(JSON.parse(body)));
    }).on('error', reject);
  });
}

// Get real-time crypto rates — BTC from Luno, others from CoinGecko
router.get('/', async (req, res) => {
  try {
    const [luno, gecko] = await Promise.all([
      httpsGet('https://api.luno.com/api/1/ticker?pair=XBTKES'),
      httpsGet('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,ripple,solana&vs_currencies=kes,usd&include_24hr_change=true'),
    ]);

    const btcKes = parseFloat(luno.last_trade || 0);
    const btcKesAsk = parseFloat(luno.ask || 0);
    const btcKesBid = parseFloat(luno.bid || 0);

    res.json({
      btcKes,
      btcKesAsk,
      btcKesBid,
      source: 'luno',
      rates: {
        BTC:  { kes: btcKes,                              usd: gecko.bitcoin?.usd  || 0, change24h: gecko.bitcoin?.usd_24h_change  || 0 },
        ETH:  { kes: gecko.ethereum?.kes  || 0,           usd: gecko.ethereum?.usd || 0, change24h: gecko.ethereum?.usd_24h_change || 0 },
        USDT: { kes: gecko.tether?.kes    || 0,           usd: gecko.tether?.usd   || 0, change24h: gecko.tether?.usd_24h_change   || 0 },
        XRP:  { kes: gecko.ripple?.kes    || 0,           usd: gecko.ripple?.usd   || 0, change24h: gecko.ripple?.usd_24h_change   || 0 },
        SOL:  { kes: gecko.solana?.kes    || 0,           usd: gecko.solana?.usd   || 0, change24h: gecko.solana?.usd_24h_change   || 0 },
      },
    });
  } catch (error) {
    console.error('Live rates error:', error);
    res.json({
      btcKes: 14200000, btcKesAsk: 14250000, btcKesBid: 14150000, source: 'fallback',
      rates: {
        BTC:  { kes: 14200000, usd: 105000, change24h: 0 },
        ETH:  { kes: 370000,   usd: 2800,   change24h: 0 },
        USDT: { kes: 135,      usd: 1,      change24h: 0 },
        XRP:  { kes: 310,      usd: 2.3,    change24h: 0 },
        SOL:  { kes: 21000,    usd: 155,    change24h: 0 },
      },
    });
  }
});

module.exports = router;