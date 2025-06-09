const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  chatId: { type: Number, unique: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Group', groupSchema);