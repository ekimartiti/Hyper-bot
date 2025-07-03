const { spawn } = require('child_process');
const path = require('path');
const express = require('express');
const fs = require('fs')
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();
const UserT = require('./models/teleuser');
const Group = require('./models/group');
let config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
let mongoStatus 
const mongoURI = config.mongoKey

//bot wa 
function KaoruBot() {
    const args = [path.join(__dirname, 'main.js'), ...process.argv.slice(2)];
    const isMongoConnected = mongoStatus ? 'true' : 'false';

    let botProcess = spawn(process.argv[0], args, {
        stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
        env: {
            ...process.env, // jangan lupakan ini
            MONGO_STATUS: isMongoConnected
        }
    });

    botProcess.on('message', (data) => {
        if (data === 'reset') {
            console.log('Restarting Bot...');
            botProcess.kill();
            KaoruBot();
        }
    });

    botProcess.on('exit', (code) => {
        console.error('Exited with code:', code);
        if ([0, 1, '.'].includes(code)) {
            KaoruBot();
        }
    });
}

// tele bot 
const runTelegramBot = require('./tele.js');
// gmail manager
const startweb = require('./app.js');
(async () => {
  try {
    await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✅ Connected to MongoDB');

    await UserT.init();
    await Group.init();
    mongoStatus = true;
  startweb()
    KaoruBot(); // WA Bot
    runTelegramBot(); // 🟢 Ini tanpa spawn, jadi pakai koneksi MongoDB yg sama

  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    mongoStatus = false;
  }
})();

