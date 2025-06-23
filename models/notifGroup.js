// models/notifGroup.js
const mongoose = require('mongoose');

const notifGroupSchema = new mongoose.Schema({
  chatId: {
    type: Number,
    required: true,
    unique: true
  }
});

module.exports = mongoose.model('NotifGroup', notifGroupSchema);