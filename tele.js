const TelegramBot = require('node-telegram-bot-api');
const QRCode = require('qrcode')
const crypto = require('crypto')
const axios = require('axios')
const mongoose = require('mongoose');
const fs = require('fs');
const ADMIN_CHAT_ID = 6720891467;
const autopromoFile = 'autopromo.json';
const Email = require('./models/email');
const { logMessage } = require('./utils/logger');
function escapeMarkdown(text = '') {
  return text.replace(/([_*\[\]()~`>#+=|{}.!-])/g, '\\$1');
}
let isAutoPromoOn = false;
const User = require('./models/teleuser');
const Group = require('./models/group');
const getMutasiQris = require('./kaoruFunction/mutasi');
// === Cek dan Muat config.json ===
let config = {};
try {
  config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
} catch (err) {
  console.error('❌ Gagal membaca config.json:', err.message);
  process.exit(1);
}

const mongoURI = config.mongoKey;
const token = config.telekey;
const keyorkut = config.keyorkut
const merchant = config.merchant
const codeqr = config.codeqr
const bot = new TelegramBot(token, { polling: true });
//module.exports = function runTelegramBot(botTele)
module.exports = function runTelegramBot(botTele) {
// === Log Berhasil Start Bot ===
let botUsername
bot.getMe()
  .then((botInfo) => {
    botUsername = botInfo.username
    console.log(`✅ Bot berhasil dijalankan sebagai @${botUsername}`);
    config.botUsername = botUsername;
    fs.writeFileSync("./config.json", JSON.stringify(config, null, 2));
    
    
  })
  .catch((err) => {
    console.error('❌ Gagal menginisialisasi bot:', err.message);
  });
// === Deteksi Error Saat Polling (umumnya karena token salah atau koneksi terputus) ===
bot.on('polling_error', (err) => {
  console.error('📡 Polling error:', err.message);
});

// === Log Error Umum (Opsional, debugging) ===
bot.on('webhook_error', (err) => {
  console.error('🌐 Webhook error:', err.message);
});


// === Koneksi MongoDB dan Setup ===
//mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
//  .then(async () => {
//    console.log('✅ Connected to MongoDB');
//    await User.init();
 //   await Group.init();

    // 🔍 Hapus user dengan chatId undefined/null
  //  const hasil = await User.deleteMany({ chatId: { $in: [null, undefined] } });
 //   console.log(`🧹 User undefined terhapus: ${hasil.deletedCount}`);
//  })
//  .catch(err => console.error('MongoDB connection error:', err));


if (fs.existsSync(autopromoFile)) {
  const data = JSON.parse(fs.readFileSync(autopromoFile));
  isAutoPromoOn = data.status === true;
}

async function saveUser(chatId) {
  try {
    await User.create({ chatId });
  } catch (err) {
///    if (err.code === 11000) {
 ///     console.log(`📌 User ${chatId} sudah ada (duplikat)`);
//    } else {
   //   console.error(`❌ Gagal menyimpan user ${chatId}:`, err);
 //   }
  }
}

async function saveGroup(chatId) {
  try {
    await Group.create({ chatId })
  }catch (err) {
   if (err.code === 11000) {
     console.log(`📌 Group ${chatId} sudah ada (duplikat)`);
   }else{
     console.error(`❌ Gagal menyimpan grup ${chatId}:`, err);
    }
  }
}

async function removeGroup(chatId) {
  await Group.deleteOne({ chatId });
}

function saveAutoPromoState(status) {
  isAutoPromoOn = status;
  fs.writeFileSync(autopromoFile, JSON.stringify({ status }, null, 2));
}


 async function cariStat() {
  const emails = await Email.find();

  const gmailFreshStok = emails.filter(e => e.soldStatus === 'not sold' && e.activeStatus === 'active' && e.ytbTrial === 'off' && e.status === 'fresh').length;
  const gmailBekas = emails.filter(e => e.status === 'bekas' && e.soldStatus === 'not sold').length;
  const ytbOnNotSold = emails.filter(e => e.ytbTrial === 'on' && e.soldStatus === 'not sold').length;
const soldEmail = emails.filter(e => e.soldStatus === 'sold').length;
const allEmail = emails.length
  return { gmailFreshStok, gmailBekas, ytbOnNotSold, soldEmail, allEmail };
}

async function rms() {
  const { gmailFreshStok, gmailBekas, ytbOnNotSold } = await cariStat();

  const teks = `
*📦 STOK GMAIL TERSEDIA*

🟢 *GMAIL FRESH* — Rp *1.300*  
📌 Stok: *${gmailFreshStok}*

🟠 *GMAIL BEKAS* — Rp *500*  
📌 Stok: *${gmailBekas}*

🔴 *TRIAL YOUTUBE* — Rp *1.600*  
📌 Stok: *${ytbOnNotSold}*

🛡️ *Garansi 48 Jam*

📲 *Order Sekarang:*  
🛒 Bot Auto Order: *@${botUsername}*  
👑 Owner: [@Eki_strZ](https://t.me/Eki_strZ)
`;

  return teks;
}


// === Auto Promo Tiap 1 Jam ===
setInterval(async () => {
  if (!isAutoPromoOn) return;

  let success = 0;
  let failed = 0;

  const groups = await Group.find();
for (const group of groups) {
  const groupId = group.chatId;
    try {
      const pesan = await rms();
      await bot.sendMessage(groupId, pesan, { parse_mode: 'Markdown' });
      success++;
    } catch (err) {
      console.error(`Gagal kirim ke grup ${groupId}: ${err.message}`);
      failed++;
      removeGroup(groupId);
    }
  }

  console.log(`🔁 Auto-Promo: ${success} sukses, ${failed} gagal`);
}, 3600000); // 1 jam
//3600000

// === Handler Pesan Masuk ===
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const chatType = msg.chat.type;
  const text = msg.text?.trim() || '';
  logMessage({
    platform: 'TG',
    time: new Date(),
    chatType: msg.chat.type,
    chatId: msg.chat.id,
    user: {
      first_name: msg.from.first_name,
      username: msg.from.username,
      id: msg.from.id
    },
    text: msg.text
  });

  // Simpan pengguna / grup
  if (chatType === 'private') {
    saveUser(chatId);
  } else if (chatType === 'group' || chatType === 'supergroup') {
    saveGroup(chatId);
  }

  // === Handler /start ===
  if (text === '/start') {
    const firstNameRaw = msg.from?.first_name || 'User';

    // Escape karakter Markdown agar tidak error
    const safeName = firstNameRaw.replace(/([*_`[\]()])/g, '');

    const welcomeMessage = `
Halo *${safeName}* 👋

Selamat datang di bot *GUDANG GMAIL* 📨

Gunakan tombol di bawah:
📝CEK STOK → untuk melihat stok tersedia dan melakukan pembelian

Butuh bantuan? Hubungi admin: [@Eki_strZ](https://t.me/Eki_strZ)
    `;

    return bot.sendMessage(chatId, welcomeMessage, {
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: [['📝CEK STOK'], ['⚠️ HELP']
        ],
        resize_keyboard: true,
        one_time_keyboard: false
      }
    });
  }

  // === Handler CEK STOK ===
  if (text === '📝CEK STOK') {
  try {
    const { gmailFreshStok, gmailBekas, ytbOnNotSold, allEmail, soldEmail} = await cariStat();
const pesan = `
📦 *STOK TERSEDIA*

🟢 *Gmail Fresh*  
▫️Harga: Rp1.300  
▫️Stok: *${gmailFreshStok}*

🟠 *Gmail Bekas*  
▫️Harga: Rp500  
▫️Stok: *${gmailBekas}*

🔴 *Gmail Trial YouTube*  
▫️Harga: Rp1.600  
▫️Stok: *${ytbOnNotSold}*

📤 *Sudah Terjual:* *${soldEmail}*  
📊 *Total Email Tersimpan:* *${allEmail}*

🛒 Gunakan tombol *ORDER SEKARANG* untuk membeli!
`;

    return bot.sendMessage(chatId, pesan, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🛒 ORDER SEKARANG', callback_data: 'order_sekarang' }
          ]
        ]
      }
    });
  } catch (err) {
    console.error('❌ Gagal ambil data stok:', err.message);
    return bot.sendMessage(chatId, '⚠️ Gagal mengambil data stok. Silakan coba lagi nanti.');
  }
}
else if (text === '⚠️ HELP'){
  const t = `
📘 *TUTORIAL ORDER GMAIL*

1️⃣ Ketik /start untuk memulai bot  
2️⃣ Klik ikon *titik 4 kotak* di samping kolom ketik  
3️⃣ Pilih menu *📝 CEK STOK* untuk melihat ketersediaan produk  
4️⃣ Klik *🛒 ORDER SEKARANG* untuk mulai pembelian  
5️⃣ Pilih jenis dan jumlah produk yang ingin dibeli  
6️⃣ Lakukan pembayaran dengan *scan QRIS*  
7️⃣ Produk akan dikirim otomatis setelah pembayaran sukses ✅

📩 *Bantuan langsung?*  
Hubungi admin: [@Eki_strZ](https://t.me/Eki_strZ)
`;
    return bot.sendMessage(chatId, t, {
      parse_mode: 'Markdown'
    });
}
});

// ===  Perintah: Kirim Promo ke Semua User ===
bot.onText(/\/sendpromot/, async (msg) => {
  const senderId = msg.chat.id;
  if (senderId !== ADMIN_CHAT_ID) {
    return bot.sendMessage(senderId, '❌ Kamu tidak punya akses.');
  }

  const users = await User.find();
  let success = 0;
  let removed = 0;

  for (const user of users) {
    const userId = user.chatId;

    try {
      const pesan = await rms(); // asumsi ini fungsi random promosi
      await bot.sendMessage(userId, pesan, { parse_mode: 'Markdown' });
      success++;
    } catch (err) {
      console.error(`❌ Gagal kirim ke ${userId}:`, err.message);

      // Hapus user jika error karena user tidak valid
      if (
        err.message.includes('Forbidden') ||
        err.message.includes('chat not found')
      ) {
        await User.deleteOne({ chatId: userId });
        removed++;
        console.log(`🧹 User ${userId} dihapus dari database.`);
      }
    }
  }

  await bot.sendMessage(senderId, `✅ Promo terkirim ke ${success} pengguna.\n🧹 ${removed} user dihapus karena tidak valid.`);
});

bot.onText(/\/cekuser/, async (msg) => {
  if (msg.chat.id !== ADMIN_CHAT_ID) return;

  const count = await User.countDocuments();
  bot.sendMessage(msg.chat.id, `📊 Total user aktif di database: *${count}*`, {
    parse_mode: 'Markdown'
  });
});

// === Perintah Broadcast Custom ===
bot.onText(/\/broadcast (.+)/, async (msg, match) => {
  const senderId = msg.chat.id;

  if (senderId !== ADMIN_CHAT_ID) {
    return bot.sendMessage(senderId, '❌ Kamu tidak punya akses.');
  }

  const broadcastMessage = match[1];

  try {
    const users = await User.find();

    for (const user of users) {
      const userId = user.chatId;
      bot.sendMessage(userId, broadcastMessage).catch((err) => {
        console.error(`Gagal kirim ke ${userId}:`, err.message);
      });
    }

    bot.sendMessage(senderId, `✅ Broadcast terkirim ke ${users.length} pengguna.`);
  } catch (error) {
    console.error('❌ Gagal mengambil daftar pengguna:', error.message);
    bot.sendMessage(senderId, '❌ Terjadi kesalahan saat broadcast.');
  }
});
// === Perintah Kirim Promo ke Semua Grup ===
bot.onText(/\/sepgrup/, async (msg) => {
  const senderId = msg.chat.id;
  if (senderId !== ADMIN_CHAT_ID) return bot.sendMessage(senderId, '❌ Kamu tidak punya akses.');
  let success = 0;
let failed = 0;
  const groups = await Group.find();
for (const group of groups) {
  const groupId = group.chatId;
    try {
      const pesan = await rms();
      await bot.sendMessage(groupId, pesan, { parse_mode: 'Markdown' });
      success++;
    } catch (err) {
      console.error(`❌ Gagal kirim ke grup ${groupId}: ${err.message}`);
      failed++;
      removeGroup(groupId);
    }
  }

  bot.sendMessage(senderId, `✅ Terkirim ke ${success} grup, ❌ Gagal: ${failed}`);
});

// === Auto Promo ON/OFF ===
bot.onText(/\/autopromoon/, (msg) => {
  const senderId = msg.chat.id;
  if (senderId !== ADMIN_CHAT_ID) return;

  if (isAutoPromoOn) {
    bot.sendMessage(senderId, 'ℹ️ Auto promo sudah aktif.');
  } else {
    saveAutoPromoState(true);
    bot.sendMessage(senderId, '✅ Auto promo ke grup diaktifkan setiap 1 jam.');
  }
});
bot.onText(/\/autopromooff/, (msg) => {
  const senderId = msg.chat.id;
  if (senderId !== ADMIN_CHAT_ID) return;

  if (!isAutoPromoOn) {
    bot.sendMessage(senderId, 'ℹ️ Auto promo memang sudah nonaktif.');
  } else {
    saveAutoPromoState(false);
    bot.sendMessage(senderId, '🛑 Auto promo ke grup telah dimatikan.');
  }
});

//cek token
bot.onText(/\/cektoken/, async (msg) => {
  const senderId = msg.chat.id;
  if (senderId !== ADMIN_CHAT_ID) {
    return bot.sendMessage(senderId, '❌ Kamu tidak punya akses.');
  }

  const { username, token } = config.orkut;
  const OrderKuota = require('./kaoruFunction/orderKuota');
  const akun = new OrderKuota(username, token);

  try {
    const res = await akun.getTransactionQris();

    if (res?.account?.results?.username) {
      const userInfo = res.account.results;
      await bot.sendMessage(senderId, 
        `✅ *Token Valid!*\n` +
        `👤 Username: \`${userInfo.username}\`\n` +
        `💰 Saldo QRIS: *${userInfo.qris_balance_str}*\n` +
        `📛 Name: *${userInfo.name}*`, 
        { parse_mode: 'Markdown' }
      );
    } else {
      await bot.sendMessage(senderId, '⚠️ Token tidak valid atau sudah expired.');
    }
  } catch (err) {
    await bot.sendMessage(senderId, `❌ Gagal cek token!\nError: ${err.message}`);
  }
});
// === Perintah Admin: /getemailfresh <jumlah> ===
// ========================================
// Fungsi Ambil Email General
// ========================================
const ambilEmail = async (msg, match, tipe, cek) => {
  const senderId = msg.chat.id;

  if (senderId !== ADMIN_CHAT_ID) {
    return bot.sendMessage(senderId, '❌ Kamu tidak punya akses.');
  }

  const jumlahStr = match[1];
  if (!jumlahStr) {
    return bot.sendMessage(senderId, `⚠️ Silakan masukkan jumlah email yang ingin diambil.\nContoh: /getemail${tipe} 10`);
  }

  const jumlah = parseInt(jumlahStr, 10);
  if (isNaN(jumlah) || jumlah <= 0 || jumlah > 1000) {
    return bot.sendMessage(senderId, '⚠️ Jumlah harus antara 1 dan 1000.');
  }

  try {
    const stat = await cariStat();
    let filter = {
      soldStatus: 'not sold',
      activeStatus: 'active'
    };

    if (tipe === 'fresh') {
      if (jumlah > stat.gmailFreshStok) {
        return bot.sendMessage(senderId, `⚠️ Stok tidak mencukupi!\nStok tersedia: ${stat.gmailFreshStok}`);
      }
      filter.ytbTrial = 'off';
      filter.status = 'fresh'; 
    } else if (tipe === 'bekas') {
      if (jumlah > stat.gmailBekas) {
        return bot.sendMessage(senderId, `⚠️ Stok tidak mencukupi!\nStok tersedia: ${stat.gmailBekas}`);
      }
      filter.status = 'bekas';
    } else if (tipe === 'youtube') {
      if (jumlah > stat.ytbOnNotSold) {
        return bot.sendMessage(senderId, `⚠️ Stok tidak mencukupi!\nStok tersedia: ${stat.ytbOnNotSold}`);
      }
      filter.ytbTrial = 'on';
    }

    
const emails = await Email.find(filter).limit(jumlah);

    if (emails.length === 0) {
      return bot.sendMessage(senderId, `⚠️ Tidak ada email ${tipe} yang tersedia.`);
    }


    const emailList = emails.map(e => e.email).join('\n');
    const filePath = `./data_email_${tipe}.txt`;
    fs.writeFileSync(filePath, emailList);

    await bot.sendDocument(senderId, filePath, {}, {
      filename: `email_${tipe}_${emails.length}.txt`,
      contentType: 'text/plain'
    });

    const ids = emails.map(e => e._id);
    fs.unlinkSync(filePath);
if (cek == true ){
    bot.sendMessage(senderId, `✅ ${emails.length} email ${tipe} berhasil diambil`)  
}else{
    await Email.updateMany({ _id: { $in: ids } }, { $set: { soldStatus: 'sold' } });

    bot.sendMessage(senderId, `✅ ${emails.length} email ${tipe} berhasil diambil & ditandai sebagai 'sold'.`);
}
  } catch (err) {
    console.error(`❌ Gagal mengambil email ${tipe}:`, err);
    return bot.sendMessage(senderId, `❌ Gagal mengambil data email ${tipe}.`);
  }
};

bot.onText(/\/getemailfresh(?: (\d+))?/, (msg, match) => ambilEmail(msg, match, 'fresh'));
bot.onText(/\/getemailbekas(?: (\d+))?/, (msg, match) => ambilEmail(msg, match, 'bekas'));
bot.onText(/\/getemailyoutube(?: (\d+))?/, (msg, match) => ambilEmail(msg, match, 'youtube'));

bot.onText(/\/gtef(?: (\d+))?/, (msg, match) => ambilEmail(msg, match, 'fresh', true));
bot.onText(/\/gteb(?: (\d+))?/, (msg, match) => ambilEmail(msg, match, 'bekas', true));
bot.onText(/\/gtey(?: (\d+))?/, (msg, match) => ambilEmail(msg, match, 'youtube', true));

//notif
const NotifGroup = require('./models/notifGroup');


bot.onText(/\/notifikasion/, async (msg) => {
  const chatId = msg.chat.id;
  const fromId = msg.from.id;

  if (msg.chat.type !== 'group' && msg.chat.type !== 'supergroup') {
    return bot.sendMessage(chatId, '❌ Perintah ini hanya bisa dijalankan di grup.');
  }

  if (fromId !== ADMIN_CHAT_ID) {
    return bot.sendMessage(chatId, '❌ Hanya owner bot yang bisa menggunakan perintah ini.');
  }

  try {
    // Pastikan tidak ada chatId duplikat lama yang mati
    const existing = await NotifGroup.findOne({ chatId });

    if (existing) {
      return bot.sendMessage(chatId, 'ℹ️ Grup ini sudah terdaftar sebagai grup notifikasi.');
    }

    // Hapus entri dengan chatId lama (< -1000000000000)
    await NotifGroup.deleteMany({ chatId: { $lt: -1000000000000 } });

    // Tambahkan yang baru
    await NotifGroup.create({ chatId });

    bot.sendMessage(chatId, '✅ Grup ini telah diaktifkan sebagai *Grup Notifikasi Pembelian*.', {
      parse_mode: 'Markdown'
    });

  } catch (err) {
    console.error('❌ Error di /notifikasion:', err);
    bot.sendMessage(chatId, '❌ Gagal menyimpan grup notifikasi.');
  }
});

async function kirimNotifikasiKeGrup({ user, produk, jumlah, total, waktu, akun }) {
  const escapeMD = (text = '') => String(text).replace(/([_*[\]()~`>#+=|{}.!-])/g, '\\$1');

  const safeName = escapeMD(user.first_name || 'User');
  const safeProduk = escapeMD(produk);
  const safeJumlah = escapeMD(jumlah);
  const safeTotal = escapeMD(`Rp${total.toLocaleString()}`);
  const safeWaktu = escapeMD(waktu.toLocaleString());

  // Escape isi akun juga agar aman
  const akunList = akun.map(a => escapeMD(a)).join('\n');

  const pesan = 
`📢 *PEMBELIAN BERHASIL*
👤 Pembeli: [${safeName}](tg://user?id=${user.id})
📦 Produk: *${safeProduk}*
🔢 Jumlah: *${safeJumlah}*
💸 Total: *${safeTotal}*
🕰️ Waktu: *${safeWaktu}*

✅ Akun Terkirim:
\`\`\`
${akunList}
\`\`\``;

  const notifGroups = await NotifGroup.find();
  let success = 0;
  let failed = 0;

  for (const group of notifGroups) {
    try {
      await bot.sendMessage(group.chatId, pesan, { parse_mode: 'Markdown' });
      success++;
    } catch (err) {
      failed++;
      console.error(`❌ Gagal kirim ke grup ${group.chatId}:`, err.message);
    }
  }

  if (success === 0) {
    try {
      await bot.sendMessage(ADMIN_CHAT_ID, `⚠️ *Fallback Notifikasi!*\n\nSemua grup notifikasi gagal menerima pesan. Berikut isi pesan:\n\n${escapeMD(pesan)}`, {
        parse_mode: 'Markdown'
      });
    } catch (err) {
      console.error('❌ Gagal kirim fallback notifikasi ke admin:', err.message);
    }
  }
}
bot.onText(/\/hapusnotifikasi/, async (msg) => {
  if (msg.from.id !== ADMIN_CHAT_ID) return;

  try {
    const result = await NotifGroup.deleteOne({ chatId: msg.chat.id });

    if (result.deletedCount === 1) {
      bot.sendMessage(msg.chat.id, '🗑️ Grup ini tidak lagi menjadi grup notifikasi.');
    } else {
      bot.sendMessage(msg.chat.id, '⚠️ Grup ini *tidak terdaftar* sebagai grup notifikasi (mungkin ID-nya berbeda).');
    }
  } catch (err) {
    console.error('❌ Gagal hapus grup notifikasi:', err.message);
    bot.sendMessage(msg.chat.id, '❌ Gagal menghapus grup notifikasi.');
  }
});
bot.onText(/\/nl/, async (msg) => {
  if (msg.chat.id !== ADMIN_CHAT_ID) return;

  const groups = await NotifGroup.find();
  const list = groups.map(g => `• \`${g.chatId}\``).join('\n') || 'Tidak ada grup terdaftar.';

  bot.sendMessage(msg.chat.id, `📋 *Daftar Grup Notifikasi:*\n${list}`, { parse_mode: 'Markdown' });
});
bot.onText(/\/bersihkanGrupNotif/, async (msg) => {
  if (msg.chat.id !== ADMIN_CHAT_ID) return;

  const notifGroups = await NotifGroup.find();
  let countDeleted = 0;

  for (const group of notifGroups) {
    try {
      await bot.sendMessage(group.chatId, '🔍 Tes koneksi grup notifikasi');
    } catch (err) {
      if (
        err.message.includes('upgraded to a supergroup') ||
        err.message.includes('chat not found') ||
        err.message.includes('Forbidden')
      ) {
        await NotifGroup.deleteOne({ chatId: group.chatId });
        countDeleted++;
        console.log(`🧹 Dihapus: ${group.chatId} karena error: ${err.message}`);
      }
    }
  }

  bot.sendMessage(msg.chat.id, `✅ Selesai membersihkan. Grup invalid dihapus: ${countDeleted}`);
});

async function validasiGrupNotifikasi() {
  const notifGroups = await NotifGroup.find();
  for (const group of notifGroups) {
    try {
      await bot.sendMessage(group.chatId, '🧪 Tes koneksi grup notifikasi');
    } catch (err) {
      if (
        err.message.includes('upgraded') ||
        err.message.includes('chat not found') ||
        err.message.includes('Forbidden')
      ) {
        await NotifGroup.updateOne({ chatId: group.chatId }, { $set: { lastKnownStatus: 'dead' } });
        await bot.sendMessage(ADMIN_CHAT_ID, `⚠️ Grup notifikasi ${group.chatId} sudah tidak valid. Harap gunakan /notifikasion ulang.`);
      }
    }
  }
}

setInterval(validasiGrupNotifikasi, 6 * 60 * 60 * 1000); // Setiap 6 jam
///orderr
const orderState = new Map(); // Menyimpan status order user
global.pendingTransactions = {
}
const reservedStock = {
  'Gmail Fresh': 0,
  'Gmail Bekas': 0,
  'Gmail Trial YouTube': 0
};
const reservedStockPerUser = new Map();

function getAvailableStock(namaProduk, totalStok) {
  return totalStok - (reservedStock[namaProduk] || 0);
}

bot.on('callback_query', async (callbackQuery) => {
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
  const userId = callbackQuery.from.id;
  const data = callbackQuery.data;

  await bot.answerCallbackQuery(callbackQuery.id);

  // ➤ 1. Tampilkan Pilihan Produk
  if (data === 'order_sekarang') {
    try {
      const { gmailFreshStok, gmailBekas, ytbOnNotSold } = await cariStat();

      const pesan = `
*🛒 PILIH PRODUK*

(1) *GMAIL FRESH* - Rp1.300  
➡️ Stok: *${gmailFreshStok}*

(2) *GMAIL BEKAS* - Rp500  
➡️ Stok: *${gmailBekas}*

(3) *GMAIL Trial YouTube* - Rp1.600  
➡️ Stok: *${ytbOnNotSold}*
`;

      await bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
        chat_id: chatId,
        message_id: msg.message_id
      });

      return bot.sendMessage(chatId, pesan, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '1', callback_data: 'order_fresh' },
              { text: '2', callback_data: 'order_bekas' },
              { text: '3', callback_data: 'order_ytb' }
            ]
          ]
        }
      });
    } catch (err) {
      console.error('❌ Gagal ambil stok:', err);
      return bot.sendMessage(chatId, '⚠️ Gagal mengambil data produk.');
    }
  }

  // ➤ 2. Pilih Produk
  if (['order_fresh', 'order_bekas', 'order_ytb'].includes(data)) {
    const produkMap = {
      order_fresh: 'Gmail Fresh',
      order_bekas: 'Gmail Bekas',
      order_ytb: 'Gmail Trial YouTube'
    };

    const { gmailFreshStok, gmailBekas, ytbOnNotSold } = await cariStat();

    const stokMap = {
      'Gmail Fresh': gmailFreshStok,
      'Gmail Bekas': gmailBekas,
      'Gmail Trial YouTube': ytbOnNotSold
    };

    const produk = produkMap[data];
    const jumlah = 1;

    await bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
      chat_id: chatId,
      message_id: msg.message_id
    });

    orderState.set(userId, { produk, jumlah, stok: stokMap[produk] });

    return bot.sendMessage(chatId, `📦 Produk terpilih *${produk}*\njumlah:`, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '➖', callback_data: 'kurang' },
            { text: `${jumlah}`, callback_data: 'dummy' },
            { text: '➕', callback_data: 'tambah' }
          ],
          [
            { text: '✅ Konfirmasi', callback_data: 'konfirmasi_order' }
          ]
        ]
      }
    });
  }

  // ➤ 3. Tambah/Kurang Jumlah Produk
  if (data === 'tambah' || data === 'kurang') {
    const order = orderState.get(userId);
    if (!order) return;

    const { jumlah, stok } = order;

    if (data === 'tambah') {
      if (jumlah >= stok) {
        return bot.answerCallbackQuery(callbackQuery.id, {
          text: '❗️Jumlah sudah maksimal sesuai stok!',
          show_alert: true
        });
      }
      order.jumlah++;
    }

    if (data === 'kurang') {
      if (jumlah <= 1) {
        return bot.answerCallbackQuery(callbackQuery.id, {
          text: '❗️Minimal 1 produk.',
          show_alert: true
        });
      }
      order.jumlah--;
    }

    orderState.set(userId, order);
    const bisaKonfirmasi = order.jumlah <= order.stok;

    return bot.editMessageReplyMarkup({
      inline_keyboard: [
        [
          { text: '➖', callback_data: 'kurang' },
          { text: `${order.jumlah}`, callback_data: 'dummy' },
          { text: '➕', callback_data: 'tambah' }
        ],
        [
          bisaKonfirmasi
            ? { text: '✅ Konfirmasi', callback_data: 'konfirmasi_order' }
            : { text: '❌ Melebihi stok', callback_data: 'dummy' }
        ]
      ]
    }, {
      chat_id: chatId,
      message_id: msg.message_id
    });
  }

  // ➤ 4. Konfirmasi Order dan Kirim QRIS
  if (data === 'konfirmasi_order') {
 if (reservedStockPerUser.has(userId)) {
  const prev = reservedStockPerUser.get(userId);
  reservedStock[prev.produk] -= prev.jumlah;
  reservedStockPerUser.delete(userId);
}   
const order = orderState.get(userId);
if (!order) return;

const { produk, jumlah } = order;

const stokTersedia = getAvailableStock(produk, order.stok);
if (jumlah > stokTersedia) {
  return bot.sendMessage(chatId, `❌ Maaf, stok tidak cukup.\nStok tersisa: ${stokTersedia}\nSilakan kurangi jumlah.`);
}

// ✅ Reserve stok
// Bersihkan stok lama user (kalau ada)
const prevReserved = reservedStockPerUser.get(userId);
if (prevReserved) {
  reservedStock[prevReserved.produk] -= prevReserved.jumlah;
}

// Tambahkan stok baru
reservedStock[produk] += jumlah;
reservedStockPerUser.set(userId, { produk, jumlah });

    try {
      const { produk, jumlah } = order;
      const hargaPerProduk = produk === 'Gmail Fresh' ? 1300 : produk === 'Gmail Bekas' ? 500 : 1600;
      const baseAmount = jumlah * hargaPerProduk;
      orderState.delete(userId); // Hapus status

      // CRC untuk QRIS
      function convertCRC16(str) {
        let crc = 0xFFFF;
        for (let c = 0; c < str.length; c++) {
          crc ^= str.charCodeAt(c) << 8;
          for (let i = 0; i < 8; i++) {
            crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
          }
        }
        return ("000" + (crc & 0xFFFF).toString(16).toUpperCase()).slice(-4);
      }

      // Buat QRIS
 async function generateUniqueFee(baseAmount) {
  const maxRetry = 10;

  try {
    for (let i = 0; i < maxRetry; i++) {
      const fee = Math.floor(Math.random() * 200) + 1;
      const totalAmount = baseAmount + fee;

      // Cek apakah amount ini sudah ada di mutasi
      const res = await akun.getTransactionQris();
      const isDuplicate = res.data?.data?.some(tx => tx.amount === totalAmount && tx.type === "CR");

      if (!isDuplicate) {
        return { success: true, fee, totalAmount };
      }
    }

    // Gagal setelah max percobaan
    return { success: false };
  } catch (err) {
    console.error("❌ Gagal generate QR unik:", err.message);
    return { success: false };
  }
}
      
      async function createQrisPayment(baseAmount, chatId) {
  const feeResult = await generateUniqueFee(baseAmount);

  if (!feeResult.success) {
    await bot.sendMessage(chatId, '⚠️ Gagal membuat QR unik. Silakan coba beberapa saat lagi.');
    return { status: false }; // atau bisa lempar error kalau kamu suka cara keras
  }

  const { fee, totalAmount } = feeResult;

  // Lanjut buat QRIS
  let qrisData = codeqr.slice(0, -4);
  const step1 = qrisData.replace("010211", "010212");
  const step2 = step1.split("5802ID");
  const uang = "54" + ("0" + totalAmount.toString().length).slice(-2) + totalAmount + "5802ID";
  const finalQrisString = step2[0] + uang + step2[1];
  const qrisWithCRC = finalQrisString + convertCRC16(finalQrisString);

  const buffer = await QRCode.toBuffer(qrisWithCRC);

  return {
    status: true,
    result: {
      kodeTransaksi: 'QR-' + crypto.randomBytes(4).toString('hex').toUpperCase(),
      baseAmount,
      fee,
      totalAmount,
      buffer
    }
  };
}
// Jika ada transaksi lama, clear interval, hapus pesan QR dan delete transaksinya
if (global.pendingTransactions[userId]) {
  const prevTxn = global.pendingTransactions[userId];

  // Hapus pesan QR lama jika masih ada
  if (prevTxn.photoMsgId) {
    try {
      await bot.deleteMessage(chatId, prevTxn.photoMsgId);
    } catch (e) {
      console.warn(`⚠️ Gagal hapus pesan QR lama:`, e.message);
    }
  }

  clearInterval(prevTxn.checkInterval);
  delete global.pendingTransactions[userId];
}

//tes dulu supaya pas debuging biar murah 
 ///totalAmount pake ini kalo udah
//tes = 50
      const qrisData = await createQrisPayment(baseAmount);
if (!qrisData.status) return; // Stop kalau gagal

      if (!Buffer.isBuffer(qrisData.result.buffer)) {
        console.error('❌ QR buffer tidak valid:', qrisData.result.buffer);
        return bot.sendMessage(chatId, '⚠️ Gagal membuat QR Code pembayaran.');
      }

      const caption = `*🧾 DETAIL PEMBAYARAN*\n\n` +
        `- Kode Transaksi: ${qrisData.result.kodeTransaksi}\n` +
        `- Produk: ${produk}\n` +
        `- Jumlah: ${jumlah}\n` +
        `- Harga: Rp ${qrisData.result.baseAmount.toLocaleString('id-ID')}\n` +
        `- Fee: Rp ${qrisData.result.fee}\n` +
        `- Total: Rp ${qrisData.result.totalAmount.toLocaleString('id-ID')}\n\n` +
        `Silakan scan QRIS di atas.\n🕒Berlaku 10 menit.`;

      const photoMsg = await bot.sendPhoto(chatId, qrisData.result.buffer, { caption, parse_mode: 'Markdown' });

      // Simpan transaksi
      global.pendingTransactions[userId] = {
  produk,
  jumlah,
  isActive: true,
  photoMsgId: photoMsg.message_id,
  startTime: Date.now(),
  checkInterval: setInterval(async () => {
          try {
            const txn = global.pendingTransactions[userId];
if (!txn) return;

const { produk, jumlah } = txn;
            const res = await akun.getTransactionQris();
            const match = res.data?.data?.find(tx =>
              tx.amount == qrisData.result.totalAmount && tx.type === "CR");
            if (match) {
              clearInterval(txn.checkInterval);
              await bot.deleteMessage(chatId, photoMsg.message_id);
const namaPembeli = escapeMarkdown(callbackQuery.from.first_name || 'Tidak diketahui');
const kodeTransaksi = escapeMarkdown(qrisData.result.kodeTransaksi);

await bot.sendMessage(chatId,
  `✅ *PEMBAYARAN BERHASIL!*\n\n` +
  `👤 *Nama Pembeli*    : ${namaPembeli}\n` +
  `🆔 *Telegram ID*     : ${userId}\n` +
  `📦 *Pesanan*         : ${jumlah}x ${escapeMarkdown(produk)}\n` +
  `🧾 *Kode Transaksi*  : ${kodeTransaksi}\n` +
  `💰 *Harga Satuan*    : Rp ${(qrisData.result.baseAmount / jumlah).toLocaleString('id-ID')}\n` +
  `➕ *Fee Unik*         : Rp ${qrisData.result.fee.toLocaleString('id-ID')}\n` +
  `💳 *Total Bayar*     : Rp ${qrisData.result.totalAmount.toLocaleString('id-ID')}\n` +
  `⏱️ *Waktu Bayar*     : ${escapeMarkdown(new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }))}\n\n` +
  `📤 *Produk akan segera dikirim...*`,
  { parse_mode: 'Markdown' }
);
              //kirim email
              try{
    const stat = await cariStat();
    let filter = {
      soldStatus: 'not sold',
      activeStatus: 'active'
    };

    if (produk === 'Gmail Fresh') {
      filter.ytbTrial = 'off';
     filter.status = 'fresh'; 
    } else if (produk === 'Gmail Bekas') {
      filter.status = 'bekas';
    } else if (produk === 'Gmail Trial YouTube') {
      filter.ytbTrial = 'on';
    }                
                
   const emails = await Email.find(filter).limit(jumlah);

// Format: email | password
const emailList = emails.map(e => `${e.email} | ${e.password}`).join('\n');

const filePath = `./data_email_${produk}.txt`;
fs.writeFileSync(filePath, emailList);
    await bot.sendDocument(chatId, filePath, {}, {
      filename: `email_${produk}_${emails.length}.txt`,
      contentType: 'text/plain'
    });

    const ids = emails.map(e => e._id);
   await kirimNotifikasiKeGrup({
  user: callbackQuery.from,
  produk: order.produk,
  jumlah: order.jumlah,
  total: qrisData.result.totalAmount, // dari QR generator
  waktu: new Date(),
  akun: emails.map(e => e.email) // yang dikirim ke pembeli
}); 
    await Email.updateMany({ _id: { $in: ids } }, { $set: { soldStatus: 'sold' } });
reservedStock[produk] -= jumlah;
reservedStockPerUser.delete(userId);
    fs.unlinkSync(filePath);

  } catch (err) {
    console.error(`❌ Gagal mengambil email ${produk}:`, err);
    return bot.sendMessage(chatId, `❌ Gagal mengambil data email ${produk}.`);
  }           
              
              
              delete global.pendingTransactions[userId];
              return;
            }

            if (Date.now() - txn.startTime > 10 * 60000) {
            reservedStock[produk] -= jumlah;  
           reservedStockPerUser.delete(userId);
              clearInterval(txn.checkInterval);
              await bot.deleteMessage(chatId, photoMsg.message_id);
              await bot.sendMessage(chatId, `❌ Pembayaran kadaluarsa. Silakan ulangi pemesanan.`);
              delete global.pendingTransactions[userId];
            }
          } catch (e) {
            console.error('❌ Cek pembayaran gagal:', e.message);
          }
        }, 10000)
      };
    } catch (err) {
      console.error('❌ ERROR KONFIRMASI:', err);
      return bot.sendMessage(chatId, 'Terjadi kesalahan saat konfirmasi order.');
    }
  }
});
}