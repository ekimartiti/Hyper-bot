const {
  WA_DEFAULT_EPHEMERAL,
  getAggregateVotesInPollMessage,
  generateWAMessageFromContent,
  proto,
  generateWAMessageContent,
  generateWAMessage,
  prepareWAMessageMedia,
  downloadContentFromMessage,
  areJidsSameUser,
  getContentType,
  useMultiFileAuthState,
  makeWASocket,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  makeWaSocket
} = require("@whiskeysockets/baileys")
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');
const util = require('util')
const chalk = require ('chalk')
const Tesseract = require("tesseract.js");
const os = require('os');
const ffmpeg = require('fluent-ffmpeg');
const getCmd = (id) => {
  const base64Hash = Buffer.from(id).toString('base64'); // Konversi ke Base64
  let position = null;
  Object.keys(_scommand).forEach((i) => {
    if(_scommand[i].id === base64Hash) {
      position = i;
    }
  });
  if(position !== null) {
    return _scommand[position].chats;
  }
};
const {
      smsg,
      fetchJson,
      getBuffer,
      fetchBuffer,
      getGroupAdmins,
      TelegraPh,
      isUrl,
      hitungmundur,
      sleep,
      clockString,
      checkBandwidth,
      runtime,
      tanggal,
      getRandom
    } = require('./lib/myfunc')
module.exports = Kaoru = async (Kaoru, m, msg, chatUpdate, store) => {
	try {
	  const {
			quotedMsg,
			mentioned,
			now,
			fromMe
		} = m
		const content = JSON.stringify(m.message);
    const type = m.message ? Object.keys(m.message)[0] : null;
    let _chats = type === "conversation" && m.message.conversation ? m.message.conversation : type == "imageMessage" && m.message.imageMessage.caption ? m.message.imageMessage.caption : type == "videoMessage" && m.message.videoMessage.caption ? m.message.videoMessage.caption : type == "extendedTextMessage" && m.message.extendedTextMessage.text ? m.message.extendedTextMessage.text : type == "buttonsResponseMessage" && m.message[type].selectedButtonId ? m.message[type].selectedButtonId : type == "stickerMessage" && getCmd(m.message[type].fileSha256.toString("base64")) !== null && getCmd(m.message[type].fileSha256.toString("base64")) !== undefined ? getCmd(m.message[type].fileSha256.toString("base64")) : "";
    const cmd = (type === 'conversation') ? m.message.conversation : (type == 'imageMessage') ? m.message.imageMessage.caption : (type == 'videoMessage') ? m.message.videoMessage.caption : (type == 'extendedTextMessage') ? m.message.extendedTextMessage.text : (type == 'buttonsResponseMessage') ? m.message.buttonsResponseMessage.selectedButtonId : (type == 'listResponseMessage') ? m.message.listResponseMessage.singleSelectReply.selectedRowId : (type === 'interactiveResponseMessage') ? JSON.parse(m.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson).id : (type == 'templateButtonReplyMessage') ? m.message.templateButtonReplyMessage.selectedId : (type === 'messageContextInfo') ? (m.message.buttonsResponseMessage?.selectedButtonId || m.message.listResponseMessage?.singleSelectReply.selectedRowId || m.text) : (type == 'stickerMessage') && (getCmd(m.message.stickerMessage.fileSha256.toString('hex')) !== null && getCmd(m.message.stickerMessage.fileSha256.toString('base64')) !== undefined) ? getCmd(m.message.stickerMessage.fileSha256.toString('base64')) : "".slice(1).trim().split(/ +/).shift().toLowerCase()
    const from = m.key.remoteJid
    var body = (m.mtype === 'interactiveResponseMessage') ? JSON.parse(m.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson).id : (m.mtype === 'conversation') ? m.message.conversation : (m.mtype == 'imageMessage') ? m.message.imageMessage.caption : (m.mtype == 'videoMessage') ? m.message.videoMessage.caption : (m.mtype == 'extendedTextMessage') ? m.message.extendedTextMessage.text : (m.mtype == 'buttonsResponseMessage') ? m.message.buttonsResponseMessage.selectedButtonId : (m.mtype == 'listResponseMessage') ? m.message.listResponseMessage.singleSelectReply.selectedRowId : (m.mtype == 'templateButtonReplyMessage') ? m.message.templateButtonReplyMessage.selectedId : (m.mtype == 'messageContextInfo') ? (m.message.buttonsResponseMessage?.selectedButtonId || m.message.listResponseMessage?.singleSelectReply.selectedRowId || m.text) : (type == 'stickerMessage') && (getCmd(m.message.stickerMessage.fileSha256.toString('base64')) !== null && getCmd(m.message.stickerMessage.fileSha256.toString('base64')) !== undefined) ? getCmd(m.message.stickerMessage.fileSha256.toString('base64')) : ""
    
        const budy = (typeof m.text === 'string') ? m.text : '';
    const prefixRegex = /^[°zZ#$@*+,.?=''():√%!¢£¥€π¤ΠΦ_&><™©®Δ^βα~¦|/\\©^]/;
    const prefix = prefixRegex.test(body) ? body.match(prefixRegex)[0] : '.';
    const isCmd = body.startsWith(prefix);
    const command = body.replace(prefix, '').trim().split(/ +/).shift().toLowerCase()
    const args = body.trim().split(/ +/).slice(1)
    const text = q = args.join(" ")
    const isGroup = m && m.isGroup ? m.isGroup : false;
    const sender = m.key.fromMe ? (Kaoru.user.id.split(':')[0] + '@s.whatsapp.net' || Kaoru.user.id) : (m.key.participant || m.key.remoteJid)
    const botNumber = await Kaoru.decodeJid(Kaoru.user.id)
    const senderNumber = sender.split('@')[0]
    const pushname = m.pushName || `${senderNumber}`
    const isBot = botNumber.includes(senderNumber)
    const isQuotedSticker = type === "extendedTextMessage" && content.includes("stickerMessage");
    const quoted = m.quoted ? m.quoted : m
    const mime = (quoted.msg || quoted).mimetype || ''
    const groupMetadata = m.isGroup ? await Kaoru.groupMetadata(from).catch(e => {}) : ''
    const groupName = m.isGroup ? groupMetadata.subject : ''
    const participants = m.isGroup ? await groupMetadata.participants : ''
    const groupAdmins = m.isGroup ? await getGroupAdmins(participants) : ''
    const isBotAdmins = m.isGroup ? groupAdmins.includes(botNumber) : false
    const isAdmins = m.isGroup ? groupAdmins.includes(m.sender) : false
    const qmsg = (quoted.msg || quoted)
  
      async function waitForResponse(sender) {
      return new Promise((resolve, reject) => {
        const listener = (msg) => {
          if(msg.sender === sender) {
            Kaoru.removeListener('message', listener); // Remove listener after getting response
            resolve(msg.body); // Resolve the promise with the user's response
          }
        };
        Kaoru.on('message', listener);
        // Set a timeout for the user to respond
        setTimeout(() => {
          Kaoru.removeListener('message', listener); // Clean up listener if no response
          reject('Timeout: No response received.');
        }, 30000); // 30 seconds timeout
      });
    }
    
    // function
async function emote(emo) {
      Kaoru.sendMessage(m.chat, {
        react: {
          text: emo,
          key: m.key
        }
      });
    }
async function sendButton(chat, judul, teks, button, m) {
      let msg = generateWAMessageFromContent(chat, {
        viewOnceMessage: {
          message: {
            'messageContextInfo': {
              'deviceListMetadata': {},
              'deviceListMetadataVersion': 2
            },
            interactiveMessage: proto.Message.InteractiveMessage.create({
              contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                  newsletterJid: saluran,
                  newsletterName: saluranName,
                  serverMessageId: -1
                },
                businessMessageForwardInfo: {
                  businessOwnerJid: Kaoru.decodeJid(Kaoru.user.id)
                },
              },
              body: proto.Message.InteractiveMessage.Body.create({
                text: teks
              }),
              footer: proto.Message.InteractiveMessage.Footer.create({
                text: namabot
              }),
              header: proto.Message.InteractiveMessage.Header.create({
                title: judul,
                subtitle: namaowner,
                hasMediaAttachment: false
              }),
              nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                buttons: button,
              })
            })
          }
        }
      }, {
        quoted: m
      })
      await Kaoru.relayMessage(msg.key.remoteJid, msg.message, {
        messageId: msg.key.id
      })
    } 
async function sendButtonImage(chat, judul, teks, buffer, button, m) {
      const uploadFile = {
        upload: Kaoru.waUploadToServer
      };
      const imageMessage = await prepareWAMessageMedia({
        image: buffer,
      }, uploadFile, );
      let msg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
          message: {
            'messageContextInfo': {
              'deviceListMetadata': {},
              'deviceListMetadataVersion': 2
            },
            interactiveMessage: proto.Message.InteractiveMessage.create({
              contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                  newsletterJid: saluran,
                  newsletterName: saluranName,
                  serverMessageId: -1
                },
                businessMessageForwardInfo: {
                  businessOwnerJid: Kaoru.decodeJid(Kaoru.user.id)
                },
              },
              body: proto.Message.InteractiveMessage.Body.create({
                text: teks
              }),
              footer: proto.Message.InteractiveMessage.Footer.create({
                text: namabot
              }),
              header: proto.Message.InteractiveMessage.Header.create({
                title: judul,
                subtitle: namaowner,
                imageMessage: imageMessage.imageMessage,
                hasMediaAttachment: true
              }),
              nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                buttons: button,
              })
            })
          }
        }
      }, {
        quoted: m
      })
      Kaoru.relayMessage(msg.key.remoteJid, msg.message, {
        messageId: msg.key.id
      })
    }
async function sendButtonVideo(chat, judul, teks, buffer, button, m) {
      const uploadFile = {
        upload: Kaoru.waUploadToServer
      };
      const videoMessage = await prepareWAMessageMedia({
        video: buffer,
      }, uploadFile, );
      let msg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
          message: {
            'messageContextInfo': {
              'deviceListMetadata': {},
              'deviceListMetadataVersion': 2
            },
            interactiveMessage: proto.Message.InteractiveMessage.create({
              contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                  newsletterJid: saluran,
                  newsletterName: saluranName,
                  serverMessageId: -1
                },
                businessMessageForwardInfo: {
                  businessOwnerJid: Kaoru.decodeJid(Kaoru.user.id)
                },
              },
              body: proto.Message.InteractiveMessage.Body.create({
                text: teks
              }),
              footer: proto.Message.InteractiveMessage.Footer.create({
                text: namabot
              }),
              header: proto.Message.InteractiveMessage.Header.create({
                title: judul,
                subtitle: namaowner,
                videoMessage: videoMessage.videoMessage,
                hasMediaAttachment: true
              }),
              nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                buttons: button,
              })
            })
          }
        }
      }, {
        quoted: m
      })
      Kaoru.relayMessage(msg.key.remoteJid, msg.message, {
        messageId: msg.key.id
      })
    }
async function sendButtonDocument(chat, judul, teks, thumb, button, m) {
      let msg = generateWAMessageFromContent(chat, {
        viewOnceMessage: {
          message: {
            'messageContextInfo': {
              'deviceListMetadata': {},
              'deviceListMetadataVersion': 2
            },
            interactiveMessage: proto.Message.InteractiveMessage.create({
              contextInfo: {
                mentionedJid: [m.sender],
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                  newsletterJid: saluran,
                  newsletterName: saluranName,
                  serverMessageId: -1
                },
                businessMessageForwardInfo: {
                  businessOwnerJid: Kaoru.decodeJid(Kaoru.user.id)
                },
                externalAdReply: {
                  title: ucapanWaktu,
                  body: pushname,
                  thumbnailUrl: thumbUrl,
                  sourceUrl: wagc,
                  mediaType: 1,
                  renderLargerThumbnail: true
                }
              },
              body: proto.Message.InteractiveMessage.Body.create({
                text: teks
              }),
              footer: proto.Message.InteractiveMessage.Footer.create({
                text: namabot
              }),
              header: proto.Message.InteractiveMessage.Header.create({
                title: judul,
                thumbnailUrl: thumbUrl,
                subtitle: namaowner,
                hasMediaAttachment: true,
                ...(await prepareWAMessageMedia({
                  document: thumb,
                  mimetype: 'image/png',
                  fileLength: 10000000000,
                  jpegThumbnail: thumb,
                  fileName: saluranName
                }, {
                  upload: Kaoru.waUploadToServer
                }))
              }),
              nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                buttons: button,
              })
            })
          }
        }
      }, {
        quoted: m
      })
      await Kaoru.relayMessage(msg.key.remoteJid, msg.message, {
        messageId: msg.key.id
      })
    };
    
Kaoru.sendImageAsStickers = async (jid, path, quoted, options = {}) => {
      let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,` [1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
      let buffer
      if(options && (options.packname || options.author)) {
        buffer = await writeExifImg(buff, options)
      } else {
        buffer = await imageToWebp(buff)
      }
      await Kaoru.sendMessage(jid, {
        sticker: {
          url: buffer
        },
        ...options
      }, {
        quoted
      }).then(response => {
        fs.unlinkSync(buffer)
        return response
      })
    }
    
    //log pesan
   if(m.message) {
      console.log(chalk.black.bgCyan(' [ NOTIF ] '), // Teks singkat dengan simbol kilat
        chalk.black.bgYellow(` ⏰ ${new Date().toLocaleTimeString()} `), // Simbol jam dan waktu
        chalk.white.bgMagenta(` 💬 ${budy || m.mtype} `), // Simbol pesan
        '\n' + chalk.green('👤 Dari: '), chalk.blue(pushname), // Nama pengirim dengan simbol orang
        chalk.redBright(`📧 ${m.sender}`), // ID pengirim dengan simbol email
        '\n' + chalk.green('📍 Chat: '), chalk.yellow(m.isGroup ? '👥 Grup' : '🔒 Privat') // Grup dengan simbol grup, privat dengan simbol gembok
      );
    }
    
    //apalh
    if(m.isGroup && isAlreadyResponList(m.chat, body.toLowerCase(), db_respon_list)) {
      var get_data_respon = getDataResponList(m.chat, body.toLowerCase(), db_respon_list)
      if(get_data_respon.isImage === false) {
        Kaoru.sendMessage(m.chat, {
          text: sendResponList(m.chat, body.toLowerCase(), db_respon_list)
        }, {
          quoted: m
        })
      } else {
        Kaoru.sendMessage(m.chat, {
          image: await getBuffer(get_data_respon.image_url),
          caption: get_data_respon.response
        }, {
          quoted: m
        })
      }
    }
    const reply = (teks) => {
      Kaoru.sendMessage(from, {
        text: teks
      }, {
        quoted: m
      })
    }
    
    // logic function
    let query = m.quoted ? m.quoted : m;
				let sebuahFoto = (query.msg || query).mimetype || query.mediaType || "";
    
    // Pastikan hanya pesan dengan prefix yang diproses
  
    
    
if (!isCmd) return;

switch(command) {
  case 'tes':
    reply("testing")
    break
    case "tes2":{
      let media = await quoted.download();
    // const media = await downloadContentFromMessage(m.message.imageMessage, "image"); 
    }
      break
    case 'ocr': {
    const { writeFileSync } = require("fs");
    const Tesseract = require("tesseract.js");

    if (!sebuahFoto) return reply(`Kirim/Balas Gambar Dengan Caption ${prefix + command}`);
    if (!/image\/(jpe?g|png)/.test(mime)) return reply(`Media tidak support!`);

    // Ambil media gambar
    const media = await quoted.download();
    const imagePath = "./temp_ocr.jpg";
    writeFileSync(imagePath, media);

    reply("⏳ Sedang memproses gambar, harap tunggu...");

    try {
        // Proses OCR dengan Tesseract.js
        const { data: { text } } = await Tesseract.recognize(imagePath, "eng", {
            tessedit_char_whitelist: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@._-", // Batasi karakter yang dikenali
        });

        // Normalisasi teks untuk memperbaiki kesalahan OCR
        let normalizedText = text.replace(/\$/g, "S"); // Mengganti semua "$" dengan "S"

        // Gunakan regex untuk mencari email dari teks hasil OCR
        const emailRegex = /[a-zA-Z0-9._%+-]+@gmail\.com/g;
        const emails = normalizedText.match(emailRegex) || ["(Tidak ditemukan email)"];

        // Kirim hasil
        await reply(`📝 Hasil OCR:\n\n${normalizedText}\n\n📧 Email yang ditemukan:\n${emails.join("\n")}`);
       reply(`${emails.join("\n")}`); 
    } catch (error) {
        reply("❌ Terjadi kesalahan saat membaca gambar.");
        console.error(error);
    }
}
    break
    case 'runtime':{
    reply(`${runtime(os.uptime())}`)
    }
    break
    case 's':
      case 'sticker':
      case 'stiker': {
        if (!sebuahFoto) return reply(`Kirim/Balas Gambar Dengan Caption ${prefix + command}`);
    if (!/image\/(jpe?g|png)/.test(mime)) return reply(`Media tidak support!`);
        reply("⏳ Sedang memproses gambar, harap tunggu...");
        if(/image|webp/.test(mime)) {
          try {
            let media = await quoted.download();
            const mediaPath = './temp/media_image.jpg';
            const outputPath = './temp/cropped_image.webp';
            fs.writeFileSync(mediaPath, media);
            if(!fs.existsSync(mediaPath)) {
              return m.reply('File gambar gagal disimpan!');
            }
            ffmpeg(mediaPath).outputOptions(['-vf', 'crop=\'min(iw,ih)\':\'min(iw,ih)\',scale=512:512']).outputFormat('webp').output(outputPath).on('end', () => {
              Kaoru.sendMessage(m.chat, {
                sticker: fs.readFileSync(outputPath),
                packname: "Kaoru Bot",
                author: "Eki store"
              }, {
                quoted: m
              })
              fs.unlinkSync(mediaPath);
              fs.unlinkSync(outputPath);
            }).on('error', (err) => {
              console.error('Error saat membuat stiker gambar:', err);
              m.reply('Terjadi kesalahan saat membuat stiker gambar. 😞');
              fs.unlinkSync(mediaPath);
            }).run();
          } catch (err) {
            console.error('Error download gambar:', err);
            m.reply('Gagal mendownload gambar! 😞');
          }
        } else if(/video/.test(mime)) {
          if((quoted.msg || quoted).seconds > 11) {
            return m.reply('Durasi video maksimal 9 detik untuk stiker!');
          }
          try {
            let media = await quoted.download();
            const mediaPath = './temp/media_video.mp4';
            const outputPath = './temp/cropped_video.webp';
            fs.writeFileSync(mediaPath, media);
            if(!fs.existsSync(mediaPath)) {
              return m.reply('File video gagal disimpan!');
            }
            ffmpeg(mediaPath).outputOptions(['-vf', 'crop=\'min(iw,ih)\':\'min(iw,ih)\',scale=512:512']).outputFormat('webp').output(outputPath).on('end', () => {
              Kaoru.sendMessage(m.chat, {
                sticker: fs.readFileSync(outputPath),
                packname: global.packname,
                author: global.author
              }, {
                quoted: m
              })
              fs.unlinkSync(mediaPath);
              fs.unlinkSync(outputPath);
            }).on('error', (err) => {
              console.error('Error saat membuat stiker video:', err);
              m.reply('Terjadi kesalahan saat membuat stiker video. 😞');
              fs.unlinkSync(mediaPath);
            }).run();
          } catch (err) {
            console.error('Error download video:', err);
            m.reply('Gagal mendownload video! 😞');
          }
        } else {
          m.reply(`Kirim atau balas gambar/video dengan caption ${prefix + command}`);
        }
      }
      break
  default:
}
    } catch (err) {
    console.log(util.format(err))
  }
}
let file = require.resolve(__filename)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(`Update ${__filename}`)
  delete require.cache[file]
  require(file)
})   