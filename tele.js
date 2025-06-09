const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const ADMIN_CHAT_ID = 6720891467;
const autopromoFile = 'autopromo.json';
const Email = require('./models/email');

let isAutoPromoOn = false;
const User = require('./models/teleuser');
const Group = require('./models/group');

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
module.exports = function runTelegramBot(botTele) {
const bot = new TelegramBot(token, { polling: true });
// === Log Berhasil Start Bot ===
bot.getMe()
  .then((botInfo) => {
    console.log(`✅ Bot berhasil dijalankan sebagai @${botInfo.username}`);
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
//mongoose.connect(mongoURI, { useNewUrlParser: //true, useUnifiedTopology: true })
//  .then(async () => {
//    console.log('✅ Connected to MongoDB');
//    await User.init();
//    await Group.init();

    // 🔍 Hapus user dengan chatId undefined/null
//    const hasil = await User.deleteMany({ chatId: { $in: [null, undefined] } });
//    console.log(`🧹 User undefined terhapus: ${hasil.deletedCount}`);
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

  const gmailFreshStok = emails.filter(e => e.soldStatus === 'not sold' && e.activeStatus === 'active' && e.ytbTrial === 'off').length;
  const gmailBekas = emails.filter(e => e.status === 'bekas' && e.soldStatus === 'not sold').length;
  const ytbOnNotSold = emails.filter(e => e.ytbTrial === 'on' && e.soldStatus === 'not sold').length;

  return { gmailFreshStok, gmailBekas, ytbOnNotSold };
}

async function rms() {
  const { gmailFreshStok, gmailBekas, ytbOnNotSold } = await cariStat();

  const teks = `
**_READY GMAIL!!!_**
*FRESH* Rp.1300  
➡️ Stok: *${gmailFreshStok}*
*BEKAS* Rp.500  
➡️ Stok: *${gmailBekas}*
*Trial YouTube* Rp.1600  
➡️ Stok: *${ytbOnNotSold}*

👌 Garansi 48 jam  
Order: [@Eki_strZ](https://t.me/Eki_strZ)
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

  console.log(`[DEBUG] Pesan dari ${chatType} (${chatId}): "${text}"`);

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
📝CEK STOK → untuk melihat stok Gmail yang tersedia

Butuh bantuan? Hubungi admin: [@Eki_strZ](https://t.me/Eki_strZ)
    `;

    return bot.sendMessage(chatId, welcomeMessage, {
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: [['📝CEK STOK']],
        resize_keyboard: true,
        one_time_keyboard: false
      }
    });
  }

  // === Handler CEK STOK ===
  if (text === '📝CEK STOK') {
    try {
      const pesan = await rms();
      return bot.sendMessage(chatId, pesan, {
        parse_mode: 'Markdown'
      });
    } catch (err) {
      console.error('❌ Gagal ambil data stok:', err.message);
      return bot.sendMessage(chatId, '⚠️ Gagal mengambil data stok. Silakan coba lagi nanti.');
    }
  }
});

// === Perintah: Kirim Promo ke Semua User ===
bot.onText(/\/sendpromot/, async (msg) => {
  const senderId = msg.chat.id;
  if (senderId !== ADMIN_CHAT_ID) return bot.sendMessage(senderId, '❌ Kamu tidak punya akses.');
  const users = await User.find();
for (const user of users) {
  const userId = user.chatId;
    try {
      const pesan = await rms();
      await bot.sendMessage(userId, pesan, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error(`Gagal kirim ke ${userId}:`, err.message);
    }
  }

  bot.sendMessage(senderId, `✅ Promo terkirim ke ${users.length} pengguna.`);
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

// === Perintah Admin: /getemailfresh <jumlah> ===
// ========================================
// Fungsi Ambil Email General
// ========================================
const ambilEmail = async (msg, match, tipe) => {
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
    } else if (tipe === 'bekas') {
      if (jumlah > stat.gmailBekas) {
        return bot.sendMessage(senderId, `⚠️ Stok tidak mencukupi!\nStok tersedia: ${stat.gmailBekas}`);
      }
      filter.emailType = 'bekas';
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
    await Email.updateMany({ _id: { $in: ids } }, { $set: { soldStatus: 'sold' } });

    fs.unlinkSync(filePath);

    bot.sendMessage(senderId, `✅ ${emails.length} email ${tipe} berhasil diambil & ditandai sebagai 'sold'.`);
  } catch (err) {
    console.error(`❌ Gagal mengambil email ${tipe}:`, err);
    return bot.sendMessage(senderId, `❌ Gagal mengambil data email ${tipe}.`);
  }
};

bot.onText(/\/getemailfresh(?: (\d+))?/, (msg, match) => ambilEmail(msg, match, 'fresh'));
bot.onText(/\/getemailbekas(?: (\d+))?/, (msg, match) => ambilEmail(msg, match, 'bekas'));
bot.onText(/\/getemailyoutube(?: (\d+))?/, (msg, match) => ambilEmail(msg, match, 'youtube'));

// === Perintah Admin: Hapus Semua User Telegram ===
bot.onText(/\/deleteallusers/, async (msg) => {
  const senderId = msg.chat.id;
  if (senderId !== ADMIN_CHAT_ID) return bot.sendMessage(senderId, '❌ Kamu tidak punya akses.');

  try {
    const result = await User.deleteMany({});
    bot.sendMessage(senderId, `🗑️ Semua data pengguna berhasil dihapus (${result.deletedCount} pengguna).`);
  } catch (err) {
    console.error('❌ Gagal menghapus pengguna:', err.message);
    bot.sendMessage(senderId, '❌ Terjadi kesalahan saat menghapus data pengguna.');
  }
});

// === Perintah Admin: Hapus Semua Grup Telegram ===
bot.onText(/\/deleteallgroups/, async (msg) => {
  const senderId = msg.chat.id;
  if (senderId !== ADMIN_CHAT_ID) return bot.sendMessage(senderId, '❌ Kamu tidak punya akses.');

  try {
    const result = await Group.deleteMany({});
    bot.sendMessage(senderId, `🗑️ Semua data grup berhasil dihapus (${result.deletedCount} grup).`);
  } catch (err) {
    console.error('❌ Gagal menghapus grup:', err.message);
    bot.sendMessage(senderId, '❌ Terjadi kesalahan saat menghapus data grup.');
  }
});
}