const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    wallet_address: {
        type: String,
        required: true
    },
    position: {
        type: String
    },
    refresh_token: {
        type: String,
    }
});

module.exports = mongoose.model('User', userSchema);