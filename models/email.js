const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
    email: String,
    password: String,
    createdAt: Date,
    activeStatus: String,
    soldStatus: String,
    ekStatus: String,
    ytbTrial: String,
    status: String
});

module.exports = mongoose.model('Email', emailSchema);
