const prompt = require('prompt-sync')();
const OrderKuota = require('./orderKuota');

(async () => {
  console.clear();
  console.log('🔐 LOGIN ORDERKUOTA');
  const username = prompt('📱 Nomor HP (08xxx): ');
  const password = prompt('🔑 Password: ');

  const akun = new OrderKuota();

  console.log('\n📨 Mengirim OTP...');
  const step1 = await akun.loginRequest(username, password);
  console.log('➡️ Response:', step1.message || step1);

  const otp = prompt('\n📥 Masukkan OTP dari WhatsApp: ');
  const step2 = await akun.getAuthToken(username, otp);

  if (step2.success) {
  const token = step2.data?.auth_token || step2.results?.token;
  const usernameRes = step2.data?.user?.username || step2.results?.username;
  const saldo = step2.results?.balance || null;

  if (token) {
    console.log('\n✅ Login berhasil!');
    console.log('👤 Username:', usernameRes);
    if (saldo) console.log('💰 Saldo:', saldo);
    console.log('🔑 AUTH TOKEN kamu:\n\n', token, '\n');

    const fs = require('fs');
    fs.writeFileSync('token.txt', token);
    console.log('📂 Token disimpan di file: token.txt');
  } else {
    console.log('\n⚠️ Token tidak ditemukan.');
    console.log('🧾 Full response:', step2);
  }
} else {
  console.log('\n❌ Gagal login!');
  console.log('🪵 Pesan:', step2.message || step2);
}
})();