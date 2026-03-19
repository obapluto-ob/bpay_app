const express = require('express');
const router = express.Router();
const https = require('https');

const LOGOS = {
  BTC:  'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  ETH:  'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  USDT: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
  USDC: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
  XRP:  'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
  SOL:  'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  TRX:  'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png',
  BCH:  'https://assets.coingecko.com/coins/images/780/small/bitcoin-cash-circle.png',
};

router.get('/:asset', (req, res) => {
  const asset = req.params.asset.toUpperCase();
  const url = LOGOS[asset];
  if (!url) return res.status(404).send('Not found');

  https.get(url, (stream) => {
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    stream.pipe(res);
  }).on('error', () => res.status(500).send('Failed'));
});

module.exports = router;
