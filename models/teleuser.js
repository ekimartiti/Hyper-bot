const mongoose = require('mongoose');

const teleUserSchema = new mongoose.Schema({
  chatId: { type: Number, unique: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TeleUser', teleUserSchema);