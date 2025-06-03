const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'inactive', 'sold'], default: 'active' },
    password: { type: String, required: true }
});

module.exports = mongoose.model('Email', emailSchema);
