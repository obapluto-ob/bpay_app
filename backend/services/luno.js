const axios = require('axios');

// Map Luno asset codes to our DB balance columns
const ASSET_MAP = {
  XBT:  { col: 'btc_balance',  accountEnv: 'LUNO_ACCOUNT_XBT'  },
  ETH:  { col: 'eth_balance',  accountEnv: 'LUNO_ACCOUNT_ETH'  },
  USDT: { col: 'usdt_balance', accountEnv: 'LUNO_ACCOUNT_USDT' },
  USDC: { col: 'usdc_balance', accountEnv: 'LUNO_ACCOUNT_USDC' },
  XRP:  { col: 'xrp_balance',  accountEnv: 'LUNO_ACCOUNT_XRP'  },
  SOL:  { col: 'sol_balance',  accountEnv: 'LUNO_ACCOUNT_SOL'  },
  TRX:  { col: 'trx_balance',  accountEnv: 'LUNO_ACCOUNT_TRX'  },
  BCH:  { col: 'bch_balance',  accountEnv: 'LUNO_ACCOUNT_BCH'  },
  KES:  { col: 'kes_balance',  accountEnv: 'LUNO_ACCOUNT_KES'  },
};

class LunoService {
  constructor() {
    this.baseURL = process.env.LUNO_BASE_URL || 'https://api.luno.com/api/1';
    this.apiKey = process.env.LUNO_API_KEY;
    this.apiSecret = process.env.LUNO_API_SECRET;
  }

  auth() {
    return { auth: { username: this.apiKey, password: this.apiSecret } };
  }

  getAssetInfo(asset) {
    return ASSET_MAP[asset.toUpperCase()] || null;
  }

  getAccountId(asset) {
    const info = this.getAssetInfo(asset);
    return info ? process.env[info.accountEnv] : null;
  }

  getBalanceCol(asset) {
    const info = this.getAssetInfo(asset);
    return info ? info.col : null;
  }

  async getAllBalances() {
    try {
      const res = await axios.get(`${this.baseURL}/balance`, this.auth());
      return { success: true, balances: res.data.balance };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || error.message };
    }
  }

  async createReceiveAddress(asset) {
    try {
      const res = await axios.get(`${this.baseURL}/funding_address`, {
        ...this.auth(),
        params: { asset },
      });
      return { success: true, address: res.data.address, addressId: res.data.account_id };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || error.message };
    }
  }

  async sendCrypto({ asset, amount, address, reference }) {
    try {
      const res = await axios.post(`${this.baseURL}/send`, {
        amount: amount.toString(),
        currency: asset,
        address,
        description: reference || 'BPay withdrawal',
      }, this.auth());
      return { success: true, withdrawalId: res.data.withdrawal_id, fee: res.data.fee };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || error.message };
    }
  }

  async getTransactions(asset) {
    try {
      const accountId = this.getAccountId(asset);
      if (!accountId) return { success: false, error: `No account ID for ${asset}` };
      const res = await axios.get(
        `${this.baseURL}/accounts/${accountId}/transactions`,
        { ...this.auth(), params: { min_row: 1, max_row: 100 } }
      );
      return { success: true, transactions: res.data.transactions || [] };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || error.message };
    }
  }

  async getWithdrawalStatus(withdrawalId) {
    try {
      const res = await axios.get(`${this.baseURL}/withdrawals/${withdrawalId}`, this.auth());
      return { success: true, status: res.data.status, data: res.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || error.message };
    }
  }
}

module.exports = new LunoService();
module.exports.ASSET_MAP = ASSET_MAP;
