const chalk = require('chalk');
const fs = require('fs');

function logMessage({ platform = 'BOT', time = new Date(), chatType = 'unknown', chatId = '', user = {}, text = '' }) {
  const now = time.toLocaleTimeString();
  const tipeChat = chatType === 'private' ? '🔒 Privat' : chatType === 'group' || chatType === 'supergroup' ? '👥 Grup' : '📦 Lainnya';
  const pesan = chalk.greenBright(text || '[Tanpa Pesan]');
  const waktu = chalk.black.bgYellow(` ⏰ ${now} `);
  const chatID = chalk.cyan(`🆔 ${chatId}`);
  const nama = user.first_name || user.pushName || 'Tanpa Nama';
  const username = user.username
    ? `@${user.username}`
    : user.id
    ? `(${user.id})`
    : '(no username)';
  const userLabel = chalk.blue(`👤 ${nama} ${chalk.gray(username)}`);

  // Platform Label
  let platformLabel = chalk.black.bgWhite(' [ BOT ]');
  if (platform === 'WA') platformLabel = chalk.black.bgGreenBright(' [ WHATSAPP ]');
  else if (platform === 'TG') platformLabel = chalk.black.bgBlue(' [ TELEGRAM ]');

  console.log(
    platformLabel,
    waktu,
    chalk.white.bgMagenta(` 💬 ${tipeChat} `),
    '\n' + chalk.green('📨 Pesan: '), pesan,
    '\n' + chalk.green('🧍 Pengirim:'), userLabel,
    '\n' + chalk.green('📍 Chat ID:'), chatID
  );

  // Simpan ke file log (opsional)
  const cleanLog = `[${now}] [${platform}] [${tipeChat}] [${nama}] ${text}\n`;
  fs.appendFileSync('unified-bot.log', cleanLog);
}

module.exports = { logMessage };