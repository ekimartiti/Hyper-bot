const axios = require('axios');
const qs = require('qs');

const data = {
  app_reg_id: 'd4_CNnueTnaoQYcz8FYnPJ:APA91bGKJQ3XTBv0vTGSUIVw_-vBo-ZmpBiB-jOnirgn7s1JklUtvPhs1xyeXAKrbI2HUVQT_U5nQytO-Fgx2PgKudaDNcN297GSqDFFM1nJmTHclPnOozQ',
  phone_android_version: '10',
  app_version_code: '250711',
  phone_uuid: 'd4_CNnueTnaoQYcz8FYnPJ',
  auth_username: 'dimasgempik',
  auth_token: '2457295:364nWOStAmeQZ5GDd0HhLwjBaI7VpyPx',
  app_version_name: '25.07.11',
  ui_mode: 'dark',
  phone_model: 'RMX1911',
  'requests[0]': 'account',
  'requests[1]': 'qris_menu'
};

(async () => {
  try {
    const res = await axios.post(
      'https://app.orderkuota.com/api/v2/get',
      qs.stringify(data),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'okhttp/4.12.0'
        }
      }
    );

    console.log('✅ Respons qris_menu:');
    console.dir(res.data, { depth: null });

  } catch (err) {
    console.error('❌ Gagal kirim request qris_menu:', err.message);
  }
})();