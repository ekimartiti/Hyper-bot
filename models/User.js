const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: String,
    password: String // nanti ini akan kita simpan dalam bentuk hash
});

module.exports = mongoose.model('User', userSchema);