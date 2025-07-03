const config = require('./config.json');
const { default: makeWASocket, makeCacheableSignalKeyStore, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, getContentType, generateForwardMessageContent, prepareWAMessageMedia, generateWAMessageFromContent, generateMessageID, downloadContentFromMessage, jidDecode, getAggregateVotesInPollMessage, proto, delay } = require("@whiskeysockets/baileys");
const { uncache, nocache } = require('./lib/loader');
const { color } = require('./lib/color');
const readline = require("readline");
const NodeCache = require("node-cache");
const msgRetryCounterCache = new NodeCache();
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const { Low, JSONFile } = require('./lib/lowdb');
const yargs = require('yargs/yargs');
const fs = require('fs');
const chalk = require('chalk');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const FileType = require('file-type');
const path = require('path');
const axios = require('axios');
const _ = require('lodash');
const moment = require('moment-timezone');
const PhoneNumber = require('awesome-phonenumber');
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif');
const { isUrl, generateMessageTag, getBuffer, getSizeMedia, await, sleep, reSize } = require('./lib/myfunc');
const SESSION_FOLDER = path.join(__dirname, 'session');
const mongoStatus = process.env.MONGO_STATUS === 'true';

global.autoswview = false;
global.welcome = true;
global.adminevent = true;
global.groupevent = true;
global.anticall = true;

const store = {
    messages: {},
    contacts: {},
    chats: {},
    groupMetadata: async (jid) => {
        return {}
    },
    bind: function(ev) {
        // Handle events
        ev.on('messages.upsert', ({ messages }) => {
            messages.forEach(msg => {
                if (msg.key && msg.key.remoteJid) {
                    this.messages[msg.key.remoteJid] = this.messages[msg.key.remoteJid] || {}
                    this.messages[msg.key.remoteJid][msg.key.id] = msg
                }
            })
        })
    }
}


require('./case.js');
nocache('../case.js', module => console.log(color('[ CHANGE ]', 'green'), color(`'${module}'`, 'green'), 'Updated'));
require('./main.js');
nocache('../main.js', module => console.log(color('[ CHANGE ]', 'green'), color(`'${module}'`, 'green'), 'Updated'));

const usePairingCode = true;
const session = `session`;

const question = (text) => {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
	return new Promise((resolve) => {
		rl.question(text, resolve)
	});
};

const colors = [
    chalk.red,
    chalk.green,
    chalk.yellow,
    chalk.blue,
    chalk.magenta,
    chalk.cyan,
  ];
  
  const logJingga = (txt)=>{
  console.log(chalk.hex('#FF6600')(txt))
  }
function kBanner() {
  const KaouruBanner = `
╭┳╮
┃╭╋━╮╭━┳┳┳┳╮
┃╰┫╋╰┫╋┃╭┫┃┃
╰┻┻━━┻━┻╯╰━╯
Kaoru Hyper Bot -_-
=======================
`;
    console.clear();
    logJingga(KaouruBanner); // Tampilkan banner dengan warna tetap
}

kBanner()
let versionFetchInProgress = false; // Menandakan apakah pengambilan versi sedang berlangsung
let retryFetchTimeout = null; // Menyimpan waktu penundaan untuk mencoba ulang pengambilan versi

async function fetchVersion() {
    // Cek apakah fetch sedang dalam proses untuk mencegah spam
    if (versionFetchInProgress) return;
    versionFetchInProgress = true;
    try {
        const response = await fetch('https://raw.githubusercontent.com/WhiskeySockets/Baileys/master/src/Defaults/baileys-version.json');
        const data = await response.json();
        return data.version;
    } catch (error) {
        console.log("Error fetching version:", error.message);
        // Jika gagal, coba ulang setelah 5 detik
        retryFetchTimeout = setTimeout(() => {
            versionFetchInProgress = false;
            fetchVersion(); // Coba lagi setelah timeout
        }, 5000);
        
        return [2, 3000, 1017531287]; // Versi default jika gagal
    } finally {
        versionFetchInProgress = false;
    }
}

//start bot
async function KaoruBot() {
  const { state, saveCreds } = await useMultiFileAuthState(`./session`)
const Kaoru = makeWASocket({
printQRInTerminal: !usePairingCode,
syncFullHistory: true,
markOnlineOnConnect: true,
connectTimeoutMs: 60000,
defaultQueryTimeoutMs: 0,
keepAliveIntervalMs: 10000,
generateHighQualityLinkPreview: true,
patchMessageBeforeSending: (message) => {
const requiresPatch = !!( message.buttonsMessage || message.templateMessage|| message.listMessage );

if (requiresPatch) {
message = {viewOnceMessage: {message: {messageContextInfo: {deviceListMetadataVersion: 2,deviceListMetadata: {},
},...message,},},};}
return message;
        },
        
version: await fetchVersion(),
browser: ["Ubuntu", "Chrome", "20.0.04"],
logger: pino({ level: 'fatal' }),
auth: { 
creds: state.creds, 
keys: makeCacheableSignalKeyStore(state.keys,pino().child({ level: 'silent', stream: 'store' })), }});


	if (!Kaoru.authState.creds.registered) {
		const phoneNumber = await question('Login Number:');
		const code = await Kaoru.requestPairingCode(phoneNumber.trim())
		console.log(chalk.yellow(` Kode Pairing Bot Whatsapp:`), chalk.green.bold(`${code}`))
	}
	
	Kaoru.ev.on("connection.update", async (update) => {
		const { connection, lastDisconnect } = update;

		if (connection === "close") {
			let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
			if (reason === DisconnectReason.badSession) {
				console.log(chalk.red("Ada masalah pada sesi, menghapus session untuk memulai sesi yang baru"))
if (fs.existsSync(SESSION_FOLDER)) {
		fs.rmSync(SESSION_FOLDER, { recursive: true, force: true });
		console.log(chalk.yellow("Folder session berhasil dihapus."));
	} 
				process.exit();
			} else if (reason === DisconnectReason.connectionClosed) {
				console.log(chalk.yellow("koneksi Terputus, menyambungkan ulang..."))
				KaoruBot();
			} else if (reason === DisconnectReason.connectionLost) {
				console.log(chalk.yellow("koneksi Terputus, menyambungkan ulang..."))
				KaoruBot();
			} else if (reason === DisconnectReason.connectionReplaced) {
				console.log(chalk.red("Sesi bentrok!!"))
				process.exit();
			} else if (reason === DisconnectReason.loggedOut) {
				console.log(chalk.red("Ada masalah pada sesi, menghapus session untuk memulai sesi yang baru"))
if (fs.existsSync(SESSION_FOLDER)) {
		fs.rmSync(SESSION_FOLDER, { recursive: true, force: true });
		console.log(chalk.yellow("Folder session berhasil dihapus."));
	} 
				process.exit();
			} else if (reason === DisconnectReason.restartRequired) {
				console.log(chalk.yellow("Memulai ulang koneksi.."))
				KaoruBot();
			} else if (reason === DisconnectReason.timedOut) {
				console.log(chalk.yellow("koneksi Terputus, menyambungkan ulang..."))
				KaoruBot();
			} else {
				console.log(reason)
				KaoruBot();
			}
		} else if (connection === "open") {
		  mongoStatus
  ? logJingga(`MongoDB On${chalk.green("•")}`)
  : logJingga(`MongoDB Off${chalk.red("•")}`);
		  
			logJingga(`Bot On${chalk.green("•")}`)
			logJingga(`Whatsapp Bot Number: ${chalk.green(JSON.stringify(Kaoru.user.id, null, 2))}`)
      logJingga(`Whatsapp Bot Name: ${chalk.green(JSON.stringify(Kaoru.user.name, null, 2))}`)
logJingga(`Telegram Bot Name: ${chalk.green(JSON.stringify(config.botUsername, null, 2))}`)
		}
	});

	Kaoru.ev.on('creds.update', saveCreds)
	Kaoru.ev.on("messages.upsert",() => { })

	Kaoru.ev.on('group-participants.update', async (anu) => {
		if (welcome) {
			try {
				let metadata = await Kaoru.groupMetadata(anu.id)
				let participants = anu.participants
				for (let num of participants) {
					let ppuser, ppgroup
					try {
						ppuser = await Kaoru.profilePictureUrl(num, 'image')
					} catch (err) {
						ppuser = `https://files.catbox.moe/vxymmw.jpg`
					}
					try {
						ppgroup = await Kaoru.profilePictureUrl(anu.id, 'image')
					} catch (err) {
						ppgroup = `https://files.catbox.moe/vxymmw.jpg`
					}
					let participantName = `@${num.split('@')[0]}`
					if (anu.action === 'add') {
						let welcomeText = `✨ *Selamat Datang di Grup, Kak ${participantName}!* 👋\n\nHai Kak! Senang kamu bisa join di grup ini. Yuk, saling sapa dan kenalan sama member lainnya. Jangan lupa baca deskripsi grup ya~ 🌱`
						await Kaoru.sendMessage(anu.id, {
							contextInfo: {
								forwardingScore: 999,
								isForwarded: true,
								externalAdReply: {
									KaoruwAdAttribution: true,
									title: `Welcome to ${metadata.subject}! 🎉`,
									body: `Dari ${namaowner}`,
									previewType: "PHOTO",
									thumbnailUrl: ppuser,
									sourceUrl: wagc
								}
							},
							text: welcomeText,
						})

					} else if (anu.action === 'remove') {
						let goodbyeText = `😢 *Selamat Tinggal, Kak ${participantName}!* 👋\n\nTerima kasih sudah singgah, meski sepertinya waktunya sudah cukup. Semoga di tempat baru kamu bisa lebih “nyaman.” Hati-hati di perjalanan~ 💐`
						await Kaoru.sendMessage(anu.id, {
							contextInfo: {
								forwardingScore: 999,
								isForwarded: true,
								externalAdReply: {
									KaoruwAdAttribution: true,
									title: `Goodbye from ${metadata.subject}! 🌟`,
									body: `Dari ${namaowner}`,
									previewType: "PHOTO",
									thumbnailUrl: ppuser,
									sourceUrl: wagc
								}
							},
							text: goodbyeText,
						})
					}
				}
			} catch (error) {
				console.error('❌ Terjadi kesalahan di fitur auto send join/leave:', error)
			}
		}
	})

	Kaoru.ev.on('call', async (callData) => {
		if (anticall) {
			let botNumber = await Kaoru.decodeJid(Kaoru.user.id);
			console.log(callData);
			for (let user of callData) {
				if (!user.isGroup && user.status === "offer") {
					try {
						let callType = user.isVideo ? '📹 Video Call' : '📞 Voice Call';
						let warningMessage = `⚠️ *Ups, Kaoru gak bisa menerima panggilan ${callType}.*\n\nMaaf, @${user.from.split('@')[0]}, panggilan seperti ini cuma bikin bot error. Kamu akan diblokir sementara.\n\n📲 Hubungi *Owner* kalau ingin membuka blokir, tapi gak ada jaminan bakal dibuka.`;
						await Kaoru.rejectCall(user.id, user.from);
						await Kaoru.sendMessage(user.from, { text: warningMessage, mentions: [user.from] });
						await Kaoru.sendMessage(
							user.from, 
							{
								contacts: {
									displayName: "Owner",
									contacts: contacts
								}
							}
						);
						await sleep(5000);
						await Kaoru.updateBlockStatus(user.from, "block");
						console.log(`🔒 Pengguna ${user.from} berhasil diblokir karena melakukan panggilan.`);
					} catch (err) {
						console.error(`❌ Gagal memproses panggilan dari ${user.from}:`, err);
					}
				}
			}
		}
	});

	Kaoru.ev.on('messages.upsert', async (chatUpdate) => {
		if (autoswview) {
			const msg = chatUpdate.messages[0];
			if (msg.key && msg.key.remoteJid === 'status@broadcast') {
				try {
					await Kaoru.readMessages([msg.key]);
					const caption = msg.message?.extendedTextMessage?.text || null;
					const mimeType = msg.message?.imageMessage?.mimetype || msg.message?.videoMessage?.mimetype || msg.message?.audioMessage?.mimetype || msg.message?.documentMessage?.mimetype || null;
					let profilePicture = `https://files.catbox.moe/vxymmw.jpg`;
					try {
						profilePicture = await Kaoru.profilePictureUrl(msg.key.participant, 'image');
					} catch (err) {
						console.warn('⚠️ Tidak dapat mengambil foto profil, menggunakan foto default.');
					}
					let ownerMessage = '';
					if (!caption && !mimeType) {
						ownerMessage = `🗑️ *Status telah dihapus oleh pengguna!*\n\n🕒 *Waktu:* ${moment.tz('Asia/Jakarta').format('HH:mm:ss DD/MM/YYYY')}\n👤 *Dari:* ${msg.pushName || 'Guest'}\n📱 *Nomor:* ${msg.key.participant.split('@')[0]}`;
					} else {
						ownerMessage = `📢 *Bot telah melihat status baru!*\n\n🕒 *Waktu:* ${moment.tz('Asia/Jakarta').format('HH:mm:ss DD/MM/YYYY')}\n👤 *Dari:* ${msg.pushName || 'Guest'}\n📱 *Nomor:* ${msg.key.participant.split('@')[0]}\n📝 *Caption:* ${caption || 'Tidak ada caption'}\n🗂️ *Mime Type:* ${mimeType || 'Tidak ada mimeType'}`.trim();
					}
					await Kaoru.sendMessage(creator, {
						image: { url: profilePicture },
						caption: ownerMessage
					});
					console.log('✅ Status berhasil dikirim ke owner dengan foto profil & informasi.');
				} catch (error) {
					console.error('❌ Error saat memproses status:', error);
				}
			}
		}
	});

	Kaoru.ev.on('group-participants.update', async (anu) => {
		if (adminevent) {
			console.log(anu);
			try {
				let participants = anu.participants;
				for (let num of participants) {
					try {
						ppuser = await Kaoru.profilePictureUrl(num, 'image');
					} catch (err) {
						ppuser = 'https://files.catbox.moe/vxymmw.jpg';
					}
					try {
						ppgroup = await Kaoru.profilePictureUrl(anu.id, 'image');
					} catch (err) {
						ppgroup = 'https://files.catbox.moe/vxymmw.jpg';
					}

					if (anu.action == 'promote') {
						const time = moment.tz('Asia/Jakarta').format('HH:mm:ss');
						const date = moment.tz('Asia/Jakarta').format('DD/MM/YYYY');
						body = `🎉 *Selamat @${num.split("@")[0]}!* Kamu baru saja dipromosikan menjadi *admin* 🥳\n\nWaktu: ${time}\nTanggal: ${date}`;
						Kaoru.sendMessage(anu.id, {
							text: body,
							contextInfo: {
								mentionedJid: [num],
								"externalAdReply": {
									"KaoruwAdAttribution": true,
									"containsAutoReply": true,
									"title": `Pemberitahuan Admin`,
									"body": `Selamat Bergabung!`,
									"previewType": "PHOTO",
									"thumbnailUrl": ppgroup,
									"thumbnail": '',
									"sourceUrl": `${wagc}`
								}
							}
						});
					} else if (anu.action == 'demote') {
						const time = moment.tz('Asia/Jakarta').format('HH:mm:ss');
						const date = moment.tz('Asia/Jakarta').format('DD/MM/YYYY');
						body = `😬 *Ups, @${num.split("@")[0]}!* Kamu telah *di-demote* dari posisi *admin*.\n\nWaktu: ${time}\nTanggal: ${date}`;
						Kaoru.sendMessage(anu.id, {
							text: body,
							contextInfo: {
								mentionedJid: [num],
								"externalAdReply": {
									"KaoruwAdAttribution": true,
									"containsAutoReply": true,
									"title": `Pemberitahuan Admin`,
									"body": `Ada perubahan status admin`,
									"previewType": "PHOTO",
									"thumbnailUrl": ppgroup,
									"thumbnail": '',
									"sourceUrl": `${wagc}`
								}
							}
						});
					}
				}
			} catch (err) {
				console.log(err);
			}
		}
	});

	Kaoru.ev.on("groups.update", async (json) => {
		if (groupevent) {
			try {
				let ppgroup = 'https://files.catbox.moe/vxymmw.jpg';
				try {
					ppgroup = await Kaoru.profilePictureUrl(json[0].id, 'image');
				} catch (err) {
					console.warn('⚠️ Gagal dapetin foto grup, pake gambar default aja ya.');
				}
				const res = json[0];
				if (res.announce === true) {
					await sleep(2000);
					Kaoru.sendMessage(res.id, {
						text: `🔒 *Gerbang Grup Ditutup Sementara!* 🔒\n\nSekarang cuma *admin* yang bisa ngobrol di sini. Nunggu aja dulu sampai admin buka lagi.`,
					});
				} else if (res.announce === false) {
					await sleep(2000);
					Kaoru.sendMessage(res.id, {
						text: `🔓 *Gerbang Grup Terbuka Kembali* 🔓\n\nSekarang semua anggota bisa ngobrol lagi di sini. Silakan ikut berpartisipasi.`,
					});
				}

				if (res.restrict === true) {
					await sleep(2000);
					Kaoru.sendMessage(res.id, {
						text: `🔐 *Info Grup Dikunci* 🔐\n\nSaat ini hanya *admin* yang bisa mengedit info grup. Mohon tetap tertib.`,
					});
				} else if (res.restrict === false) {
					await sleep(2000);
					Kaoru.sendMessage(res.id, {
						text: `🔓 *Info Grup Dibuka* 🔓\n\nSemua anggota bisa mengedit info grup. Mohon untuk tetap sopan dan bijak.`,
					});
				}

				if (res.desc) {
					await sleep(2000);
					Kaoru.sendMessage(res.id, {
						text: `📝 *Deskripsi Baru Nih* 📝\n\nGrup ini punya deskripsi baru lho:\n\n${res.desc}\n\nCek aja, semoga bermanfaat! 🌿`,
					});
				}

				if (res.subject) {
					await sleep(2000);
					Kaoru.sendMessage(res.id, {
						text: `🖊️ *Nama Grup Baru* 🖊️\n\nSekarang grup kita punya nama baru:\n\n*${res.subject}*\n\nSemoga makin nyaman di sini! 🌟`,
					});
				}

				if (res.memberAddMode === true) {
					await sleep(2000);
					Kaoru.sendMessage(res.id, {
						text: `🛡️ *Tambah Anggota? Tertutup Dulu* 🛡️\n\nSekarang cuma *admin* yang bisa nambah anggota baru. Harap patuhi aturan ya. 🌱`,
					});
				} else if (res.memberAddMode === false) {
					await sleep(2000);
					Kaoru.sendMessage(res.id, {
						text: `✅ *Tambah Anggota Bebas* ✅\n\nSekarang semua anggota bisa ngajak teman-temannya masuk grup ini. Yuk, makin ramai! 🌿`,
					});
				}

				if (res.joinApprovalMode === true) {
					await sleep(2000);
					Kaoru.sendMessage(res.id, {
						text: `🛡️ *Pintu Masuk Dijaga Ketat* 🛡️\n\nCalon anggota baru harus dapet *persetujuan admin* dulu ya sebelum bisa gabung. Tetap aman dan tertib! 🌱`,
					});
				} else if (res.joinApprovalMode === false) {
					await sleep(2000);
					Kaoru.sendMessage(res.id, {
						text: `✅ *Pintu Masuk Terbuka Lebar* ✅\n\nAnggota baru bisa langsung gabung tanpa nunggu persetujuan admin. Yuk, tambah ramai di sini! 🌟`,
					});
				}

			} catch (error) {
				console.error('❌ Oops, ada yang error waktu proses pembaruan grup:', error);
			}
		}
	});

	Kaoru.ev.on('messages.upsert', async chatUpdate => {
		try {
			msg = chatUpdate.messages[0]
			if (!msg.message) return
			msg.message = (Object.keys(msg.message)[0] === 'ephemeralMessage') ? msg.message.ephemeralMessage.message : msg.message
			if (msg.key && msg.key.remoteJid === 'status@broadcast') return
			if (!Kaoru.public && !msg.key.fromMe && chatUpdate.type === 'notify') return
			if (msg.key.id.startsWith('') && msg.key.id.length === 16) return
			if (msg.key.id.startsWith('BAE5')) return
			m = smsg(Kaoru, msg, store)
			require("./case")(Kaoru, m, chatUpdate, store)
		} catch (err) {
			console.log(err)
		}
	})

	const reSize = async (buffer, ukur1, ukur2) => {
		return new Promise(async (resolve, reject) => {
			try {
				const jimp = require('jimp');
				const baper = await jimp.read(buffer);
				const ab = await baper.resize(ukur1, ukur2).getBufferAsync(jimp.MIME_JPEG);
				resolve(ab);
			} catch (error) {
				reject(error);
			}
		});
	};

	Kaoru.decodeJid = (jid) => {
		if (!jid) return jid
		if (/:\d+@/gi.test(jid)) {
			let decode = jidDecode(jid) || {}
			return decode.user && decode.server && decode.user + '@' + decode.server || jid
		} else return jid
	}

	Kaoru.ev.on('contacts.update', update => {
		for (let contact of update) {
			let id = Kaoru.decodeJid(contact.id)
			if (store && store.contacts) store.contacts[id] = {
				id,
				name: contact.notify
			}
		}
	})

	Kaoru.getName = (jid, withoutContact = false) => {
		id = Kaoru.decodeJid(jid)
		withoutContact = Kaoru.withoutContact || withoutContact
		let v
		if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
			v = store.contacts[id] || {}
			if (!(v.name || v.subject)) v = Kaoru.groupMetadata(id) || {}
			resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
		})
		else v = id === '0@s.whatsapp.net' ? {
			id,
			name: 'WhatsApp'
		} : id === Kaoru.decodeJid(Kaoru.user.id) ? Kaoru.user : (store.contacts[id] || {})
		return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
	}

	Kaoru.sendContact = async (jid, kontak, quoted = '', opts = {}) => {
		let list = []
		for (let i of kontak) {
			list.push({
				displayName: await Kaoru.getName(i),
				vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${await Kaoru.getName(i)}\nFN:${await Kaoru.getName(i)}\nitem1.TEL;waid=${i.split('@')[0]}:${i.split('@')[0]}\nitem1.X-ABLabel:Mobile\nEND:VCARD`
			})
		}
		Kaoru.sendMessage(jid, { contacts: { displayName: `${list.length} Contact`, contacts: list }, ...opts }, { quoted })
	}

	Kaoru.public = true

	Kaoru.serializeM = (m) => smsg(Kaoru, m, store)

	Kaoru.sendText = (jid, text, quoted = '', options) => Kaoru.sendMessage(jid, {
		text: text,
		...options
	}, {
		quoted,
		...options
	})

	Kaoru.sendImage = async (jid, path, caption = '', quoted = '', options) => {
		let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,` [1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
		return await Kaoru.sendMessage(jid, {
			image: buffer,
			caption: caption,
			...options
		}, {
			quoted
		})
	}

	Kaoru.sendTextWithMentions = async (jid, text, quoted, options = {}) => Kaoru.sendMessage(jid, {
		text: text,
		mentions: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net'),
		...options
	}, {
		quoted
	})

	Kaoru.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
		let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
		let buffer
		if (options && (options.packname || options.author)) {
			buffer = await writeExifImg(buff, options)
		} else {
			buffer = await imageToWebp(buff)
		}
		await Kaoru.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
		.then( response => {
			fs.unlinkSync(buffer)
			return response
		})
	}

	Kaoru.sendAudio = async (jid, path, quoted = '', ptt = false, options) => {
		let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
		return await Kaoru.sendMessage(jid, { audio: buffer, ptt: ptt, ...options }, { quoted })
	}

	Kaoru.sendVideo = async (jid, path, caption = '', quoted = '', gif = false, options) => {
		let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
		return await Kaoru.sendMessage(jid, { video: buffer, caption: caption, gifPlayback: gif, ...options }, { quoted })
	}

	Kaoru.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
		let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
		let buffer
		if (options && (options.packname || options.author)) {
			buffer = await writeExifVid(buff, options)
		} else {
			buffer = await videoToWebp(buff)
		}
		await Kaoru.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
		return buffer
	}

	Kaoru.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
		let mime = '';
		let res = await axios.head(url)
		mime = res.headers['content-type']
		if (mime.split("/")[1] === "gif") {
			 return Kaoru.sendMessage(jid, { video: await getBuffer(url), caption: caption, gifPlayback: true, ...options}, { quoted: quoted, ...options})
		}
		let type = mime.split("/")[0]+"Message"
		if (mime === "application/pdf"){
			return Kaoru.sendMessage(jid, { document: await getBuffer(url), mimetype: 'application/pdf', caption: caption, ...options}, { quoted: quoted, ...options })
		}
		if (mime.split("/")[0] === "image"){
			return Kaoru.sendMessage(jid, { image: await getBuffer(url), caption: caption, ...options}, { quoted: quoted, ...options})
		}
		if (mime.split("/")[0] === "video"){
			return Kaoru.sendMessage(jid, { video: await getBuffer(url), caption: caption, mimetype: 'video/mp4', ...options}, { quoted: quoted, ...options })
		}
		if (mime.split("/")[0] === "audio"){
			return Kaoru.sendMessage(jid, { audio: await getBuffer(url), caption: caption, mimetype: 'audio/mpeg', ...options}, { quoted: quoted, ...options })
		}
	}

	Kaoru.getFile = async (PATH, save) => {
		let res
		let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await getBuffer(PATH)) : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0)
		//if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer')
		let type = await FileType.fromBuffer(data) || {
			mime: 'application/octet-stream',
			ext: '.bin'
		}
		filename = path.join(__filename, '../src/' + new Date * 1 + '.' + type.ext)
		if (data && save) fs.promises.writeFile(filename, data)
		return {
			res,
			filename,
			size: await getSizeMedia(data),
			...type,
			data
		}
	}

	Kaoru.sendFile = async (jid, path, filename = '', caption = '', quoted, ptt = false, options = {}) => {
		let type = await Kaoru.getFile(path, true);
		let { res, data: file, filename: pathFile } = type;
		if (res && res.status !== 200 || file.length <= 65536) {
		try {
			throw {
				json: JSON.parse(file.toString())
			};
		} catch (e) {
			if (e.json) throw e.json;
		}
	}
	let opt = {
		filename
	};
	if (quoted) opt.quoted = quoted;
	if (!type) options.asDocument = true;
	let mtype = '',
	mimetype = type.mime,
	convert;
	if (/webp/.test(type.mime) || (/image/.test(type.mime) && options.asSticker)) mtype = 'sticker';
	else if (/image/.test(type.mime) || (/webp/.test(type.mime) && options.asImage)) mtype = 'image';
	else if (/video/.test(type.mime)) mtype = 'video';
	else if (/audio/.test(type.mime)) {
		convert = await (ptt ? toPTT : toAudio)(file, type.ext);
		file = convert.data;
		pathFile = convert.filename;
		mtype = 'audio';
		mimetype = 'audio/ogg; codecs=opus';
	} else mtype = 'document';
		if (options.asDocument) mtype = 'document';
		delete options.asSticker;
		delete options.asLocation;
		delete options.asVideo;
		delete options.asDocument;
		delete options.asImage;
		let message = { ...options, caption, ptt, [mtype]: { url: pathFile }, mimetype };
		let m;
		try {
			m = await Kaoru.sendMessage(jid, message, { ...opt, ...options });
		} catch (e) {
			//console.error(e)
			m = null;
		} finally {
			if (!m) m = await Kaoru.sendMessage(jid, { ...message, [mtype]: file }, { ...opt, ...options });
			file = null;
			return m;
		}
	}

	Kaoru.cMod = (jid, copy, text = '', sender = Kaoru.user.id, options = {}) => {
		//let copy = message.toJSON()
		let mtype = Object.keys(copy.message)[0]
		let isEphemeral = mtype === 'ephemeralMessage'
		if (isEphemeral) {
			mtype = Object.keys(copy.message.ephemeralMessage.message)[0]
		}
		let msg = isEphemeral ? copy.message.ephemeralMessage.message : copy.message
		let content = msg[mtype]
		if (typeof content === 'string') msg[mtype] = text || content
		else if (content.caption) content.caption = text || content.caption
		else if (content.text) content.text = text || content.text
		if (typeof content !== 'string') msg[mtype] = {
			...content,
			...options
		}
		if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
		else if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
		if (copy.key.remoteJid.includes('@s.whatsapp.net')) sender = sender || copy.key.remoteJid
		else if (copy.key.remoteJid.includes('@broadcast')) sender = sender || copy.key.remoteJid
		copy.key.remoteJid = jid
		copy.key.fromMe = sender === Kaoru.user.id
		return proto.WebMessageInfo.fromObject(copy)
	}

	Kaoru.sendMedia = async (jid, path, fileName = '', caption = '', quoted = '', options = {}) => {
		let types = await Kaoru.getFile(path, true)
		let { mime, ext, res, data, filename } = types
		if (res && res.status !== 200 || file.length <= 65536) {
			try { throw { json: JSON.parse(file.toString()) } }
			catch (e) { if (e.json) throw e.json }
		}
		let type = '', mimetype = mime, pathFile = filename
		if (options.asDocument) type = 'document'
		if (options.asSticker || /webp/.test(mime)) {
			let { writeExif } = require('./lib/exif')
			let media = { mimetype: mime, data }
			pathFile = await writeExif(media, { packname: options.packname ? options.packname : global.packname, author: options.author ? options.author : global.author, categories: options.categories ? options.categories : [] })
			await fs.promises.unlink(filename)
			type = 'sticker'
			mimetype = 'image/webp'
		}
		else if (/image/.test(mime)) type = 'image'
		else if (/video/.test(mime)) type = 'video'
		else if (/audio/.test(mime)) type = 'audio'
		else type = 'document'
		await Kaoru.sendMessage(jid, { [type]: { url: pathFile }, caption, mimetype, fileName, ...options }, { quoted, ...options })
		return fs.promises.unlink(pathFile)
	}

	Kaoru.copyNForward = async (jid, message, forceForward = false, options = {}) => {
		let vtype
		if (options.readViewOnce) {
			message.message = message.message && message.message.ephemeralMessage && message.message.ephemeralMessage.message ? message.message.ephemeralMessage.message : (message.message || undefined)
			vtype = Object.keys(message.message.viewOnceMessage.message)[0]
			delete(message.message && message.message.ignore ? message.message.ignore : (message.message || undefined))
			delete message.message.viewOnceMessage.message[vtype].viewOnce
			message.message = {
				...message.message.viewOnceMessage.message
			}
		}
		let mtype = Object.keys(message.message)[0]
		let content = await generateForwardMessageContent(message, forceForward)
		let ctype = Object.keys(content)[0]
		let context = {}
		if (mtype != "conversation") context = message.message[mtype].contextInfo
		content[ctype].contextInfo = {
			...context,
			...content[ctype].contextInfo
		}
		const waMessage = await generateWAMessageFromContent(jid, content, options ? {
			...content[ctype],
			...options,
			...(options.contextInfo ? {
				contextInfo: {
					...content[ctype].contextInfo,
					...options.contextInfo
				}
			} : {})
		} : {})
		await Kaoru.relayMessage(jid, waMessage.message, { messageId:waMessage.key.id })
		return waMessage
	}

	Kaoru.parseMention = (text = '') => {
		return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net')
	}

	Kaoru.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
		let quoted = message.msg ? message.msg : message
		let mime = (message.msg || message).mimetype || ''
		let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
		const stream = await downloadContentFromMessage(quoted, messageType)
		let buffer = Buffer.from([])
		for await(const chunk of stream) {
			buffer = Buffer.concat([buffer, chunk])
		}
		let type = await FileType.fromBuffer(buffer)
		let trueFileName = attachExtension ? ('./temp/' + filename + '.' + type.ext) : './temp/' + filename
		await fs.writeFileSync(trueFileName, buffer)
		return trueFileName
	}

	Kaoru.downloadMediaMessage = async (message) => {
		let mime = (message.msg || message).mimetype || ''
		let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
		const stream = await downloadContentFromMessage(message, messageType)
		let buffer = Buffer.from([])
		for await(const chunk of stream) {
			buffer = Buffer.concat([buffer, chunk])
		}

		return buffer
	}
 
	return Kaoru
};

KaoruBot()

function smsg(Kaoru, m, store) {
if (!m) return m
let M = proto.WebMessageInfo
if (m.key) {
m.id = m.key.id
m.isBaileys = m.id.startsWith('BAE5') && m.id.length === 16
m.chat = m.key.remoteJid
m.fromMe = m.key.fromMe
m.isGroup = m.chat.endsWith('@g.us')
m.sender = Kaoru.decodeJid(m.fromMe && Kaoru.user.id || m.participant || m.key.participant || m.chat || '')
if (m.isGroup) m.participant = Kaoru.decodeJid(m.key.participant) || ''
}
if (m.message) {
m.mtype = getContentType(m.message)
m.msg = (m.mtype == 'viewOnceMessage' ? m.message[m.mtype].message[getContentType(m.message[m.mtype].message)] : m.message[m.mtype])
m.body = m.message.conversation || m.msg.caption || m.msg.text || (m.mtype == 'listResponseMessage') && m.msg.singleSelectReply.selectedRowId || (m.mtype == 'buttonsResponseMessage') && m.msg.selectedButtonId || (m.mtype == 'viewOnceMessage') && m.msg.caption || m.text
let quoted = m.quoted = m.msg.contextInfo ? m.msg.contextInfo.quotedMessage : null
m.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : []
if (m.quoted) {
let type = getContentType(quoted)
m.quoted = m.quoted[type]
if (['productMessage'].includes(type)) {
type = getContentType(m.quoted)
m.quoted = m.quoted[type]
}
if (typeof m.quoted === 'string') m.quoted = {
text: m.quoted
}
m.quoted.mtype = type
m.quoted.id = m.msg.contextInfo.stanzaId
m.quoted.chat = m.msg.contextInfo.remoteJid || m.chat
m.quoted.isBaileys = m.quoted.id ? m.quoted.id.startsWith('BAE5') && m.quoted.id.length === 16 : false
m.quoted.sender = Kaoru.decodeJid(m.msg.contextInfo.participant)
m.quoted.fromMe = m.quoted.sender === Kaoru.decodeJid(Kaoru.user.id)
m.quoted.text = m.quoted.text || m.quoted.caption || m.quoted.conversation || m.quoted.contentText || m.quoted.selectedDisplayText || m.quoted.title || ''
m.quoted.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : []
m.getQuotedObj = m.getQuotedMessage = async () => {
if (!m.quoted.id) return false
let q = await store.loadMessage(m.chat, m.quoted.id, conn)
 return exports.smsg(conn, q, store)
}
let vM = m.quoted.fakeObj = M.fromObject({
key: {
remoteJid: m.quoted.chat,
fromMe: m.quoted.fromMe,
id: m.quoted.id
},
message: quoted,
...(m.isGroup ? { participant: m.quoted.sender } : {})
})
m.quoted.delete = () => Kaoru.sendMessage(m.quoted.chat, { delete: vM.key })
m.quoted.copyNForward = (jid, forceForward = false, options = {}) => Kaoru.copyNForward(jid, vM, forceForward, options)
m.quoted.download = () => Kaoru.downloadMediaMessage(m.quoted)
}
}
if (m.msg.url) m.download = () => Kaoru.downloadMediaMessage(m.msg)
m.text = m.msg.text || m.msg.caption || m.message.conversation || m.msg.contentText || m.msg.selectedDisplayText || m.msg.title || ''
m.reply = (text, chatId = m.chat, options = {}) => Buffer.isBuffer(text) ? Kaoru.sendMedia(chatId, text, 'file', '', m, { ...options }) : Kaoru.sendText(chatId, text, m, { ...options })
m.copy = () => exports.smsg(conn, M.fromObject(M.toObject(m)))
m.copyNForward = (jid = m.chat, forceForward = false, options = {}) => Kaoru.copyNForward(jid, m, forceForward, options)

return m
}

process.on('uncaughtException', function (err) {
let e = String(err)
if (e.includes("conflict")) return
if (e.includes("Cannot derive from empty media key")) return
if (e.includes("Socket connection timeout")) return
if (e.includes("not-authorized")) return
if (e.includes("already-exists")) return
if (e.includes("rate-overlimit")) return
if (e.includes("Connection Closed")) return
if (e.includes("Timed Out")) return
if (e.includes("Value not found")) return
console.log('Caught exception: ', err)
})
