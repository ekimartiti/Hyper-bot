// mutasiLocal.js
const OrderKuota = require('./orderKuota'); // pastikan sudah ada file ini
const fs = require('fs');
let config = {};
try {
  config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
} catch (err) {
  console.error('❌ Gagal membaca config.json:', err.message);
  process.exit(1);
}
const username = config.orkut.username
const token = config.orkut.token

async function getMutasiQris() {
  try {
    const akun = new OrderKuota(username, token);
    await akun.triggerQrisMenu(); // WAJIB
    const formatted = await akun.getFormattedMutasiQris();

    return {
      data: {
        status: true,
        message: 'Berhasil menampilkan mutasi',
        merchant: `OK${username}`,
        data: formatted // ⬅️ struktur tetap pakai .data.data
      }
    };
  } catch (err) {
    return {
      data: {
        status: false,
        message: 'Gagal mengambil mutasi',
        data: [],
        error: err.message
      }
    };
  }
}

module.exports = getMutasiQris;