const axios = require('axios');
const qs = require('qs');

class OrderKuota {
  static API_URL = 'https://app.orderkuota.com:443/api/v2';
  static API_URL_ORDER = 'https://app.orderkuota.com:443/api/v2/order';
  static HOST = 'app.orderkuota.com';
  static USER_AGENT = 'okhttp/4.10.0';
  static APP_VERSION_NAME = '25.03.14';
  static APP_VERSION_CODE = '250314';
  static APP_REG_ID = 'di309HvATsaiCppl5eDpoc:APA91bFUcTOH8h2XHdPRz2qQ5Bezn-3_TaycFcJ5pNLGWpmaxheQP9Ri0E56wLHz0_b1vcss55jbRQXZgc9loSfBdNa5nZJZVMlk7GS1JDMGyFUVvpcwXbMDg8tjKGZAurCGR4kDMDRJ';

  constructor(username = null, authToken = null) {
    this.username = username;
    this.authToken = authToken;
  }

  async loginRequest(username, password) {
    const payload = qs.stringify({
      username,
      password,
      app_reg_id: OrderKuota.APP_REG_ID,
      app_version_code: OrderKuota.APP_VERSION_CODE,
      app_version_name: OrderKuota.APP_VERSION_NAME,
    });

    return this.request("POST", `${OrderKuota.API_URL}/login`, payload, true);
  }

  async getAuthToken(username, otp) {
    const payload = qs.stringify({
      username,
      password: otp,
      app_reg_id: OrderKuota.APP_REG_ID,
      app_version_code: OrderKuota.APP_VERSION_CODE,
      app_version_name: OrderKuota.APP_VERSION_NAME,
    });

    return this.request("POST", `${OrderKuota.API_URL}/login`, payload, true);
  }

async getTransactionQris() {
  const today = new Date().toLocaleDateString('fr-CA'); // yyyy-mm-dd

  const payload = qs.stringify({
    app_reg_id: 'd4_CNnueTnaoQYcz8FYnPJ:APA91bGKJQ3XTBv0vTGSUIVw_-vBo-ZmpBiB-jOnirgn7s1JklUtvPhs1xyeXAKrbI2HUVQT_U5nQytO-Fgx2PgKudaDNcN297GSqDFFM1nJmTHclPnOozQ',
    phone_uuid: 'd4_CNnueTnaoQYcz8FYnPJ',
    phone_model: 'RMX1911',
    phone_android_version: '10',
    ui_mode: 'dark',
    app_version_code: '250327',
    app_version_name: '25.03.27',
    auth_username: this.username,
    auth_token: this.authToken,

    'requests[qris_history][jenis]': 'kredit',
    'requests[qris_history][jumlah]': '',
    'requests[qris_history][keterangan]': '',
    'requests[qris_history][page]': 1,
    'requests[qris_history][dari_tanggal]': today,
    'requests[qris_history][ke_tanggal]': today,
    'requests[0]': 'account',
  });

  return this.request("POST", `${OrderKuota.API_URL}/get`, payload, true);
}

async getFormattedMutasiQris() {
  const raw = await this.getTransactionQris();
  const history = raw?.qris_history?.results || [];

  return history.map((trx) => {
    // Konversi tanggal ke format 'YYYY-MM-DD HH:mm:00'
    const date = trx.tanggal
      .replace(/\//g, '-')
      .replace(/(\d{2})-(\d{2})-(\d{4})/, '$3-$2-$1') + ':00';

    return {
      date,
      amount: trx.kredit?.replace(/\./g, '') || '0',
      type: 'CR',
      qris: 'static',
      brand_name: trx.brand?.name || 'UNKNOWN',
      issuer_reff: trx.issuer_reff || trx.brand?.ref || '',
      buyer_reff: trx.keterangan?.trim() || '',
      balance: trx.saldo_akhir?.replace(/\./g, '') || '0'
    };
  });
}

  async withdrawalQris(amount = '') {
    const payload = qs.stringify({
      app_reg_id: OrderKuota.APP_REG_ID,
      app_version_code: OrderKuota.APP_VERSION_CODE,
      auth_username: this.username,
      'requests[qris_withdraw][amount]': amount,
      auth_token: this.authToken,
      app_version_name: OrderKuota.APP_VERSION_NAME,
    });

    return this.request("POST", `${OrderKuota.API_URL}/get`, payload, true);
  }

  buildHeaders() {
    return {
      'Host': OrderKuota.HOST,
      'User-Agent': OrderKuota.USER_AGENT,
      'Content-Type': 'application/x-www-form-urlencoded',
    };
  }

  async request(method = 'GET', url, data = null, useHeaders = false) {
    try {
      const options = {
        method,
        url,
        headers: useHeaders ? this.buildHeaders() : {},
        data,
        timeout: 15000,
      };

      const response = await axios(options);
      return response.data;
    } catch (error) {
      return {
        error: true,
        message: error.message,
        details: error.response?.data || null,
      };
    }
  }
  
  async getFormattedMutasiQris() {
  const raw = await this.getTransactionQris();

  const history = raw?.qris_history?.results || [];

  return history.map((trx) => {
    const isCredit = trx.kredit !== '0';
    const amount = isCredit ? trx.kredit : trx.debet;
    const type = isCredit ? 'CR' : 'DB';

    return {
      date: trx.tanggal.replace(/\//g, '-').replace(/(\d{2})-(\d{2})-(\d{4})/, '$3-$2-$1') + ':00', // konversi ke format GAS
      amount: amount.replace(/\./g, '').replace(',', '.'), // angka tanpa titik
      type,
      qris: 'static', // asumsi default
      brand_name: trx.brand?.name || 'UNKNOWN',
      issuer_reff: trx.brand?.ref || '',
      buyer_reff: trx.keterangan?.trim() || '',
      balance: trx.saldo_akhir?.replace(/\./g, '') || '0'
    };
  });
}
async getTransactionQrisSniffed() {
  const payload = qs.stringify({
    app_reg_id: 'd4_CNnueTnaoQYcz8FYnPJ:APA91bGKJQ3XTBv0vTGSUIVw_-vBo-ZmpBiB-jOnirgn7s1JklUtvPhs1xyeXAKrbI2HUVQT_U5nQytO-Fgx2PgKudaDNcN297GSqDFFM1nJmTHclPnOozQ',
    phone_uuid: 'd4_CNnueTnaoQYcz8FYnPJ',
    phone_model: 'RMX1911',
    phone_android_version: '10',
    ui_mode: 'dark',
    app_version_code: '250327',
    app_version_name: '25.03.27',
    auth_username: 'dimasgempik',
    auth_token: '2457295:364nWOStAmeQZ5GDd0HhLwjBaI7VpyPx',
    'requests[qris_history][jenis]': 'kredit',
    'requests[qris_history][keterangan]': '',
    'requests[qris_history][jumlah]': '',
    'requests[qris_history][page]': 1,
    'requests[qris_history][dari_tanggal]': '',
    'requests[qris_history][ke_tanggal]': '',
    'requests[0]': 'account',
  });

  return this.request('POST', `${OrderKuota.API_URL}/get`, payload, true);
}
async triggerQrisMenu() {
  const payload = qs.stringify({
    app_reg_id: OrderKuota.APP_REG_ID,
    phone_android_version: '10',
    phone_uuid: 'd4_CNnueTnaoQYcz8FYnPJ',
    auth_username: this.username,
    auth_token: this.authToken,
    app_version_code: '250711',
    app_version_name: '25.07.11',
    ui_mode: 'dark',
    phone_model: 'RMX1911',
    'requests[0]': 'account',
    'requests[1]': 'qris_menu'
  });

  return this.request("POST", `${OrderKuota.API_URL}/get`, payload, true);
}

}




module.exports = OrderKuota;