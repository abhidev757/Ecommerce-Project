const mongoose = require('mongoose');
const moment = require('moment')  


const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String, // Success or Fail
        required: true
    },
    type: {
        type: String, // Credit or Debit
        required: true
    },
    date: {
        type: Date,
        default: Date.now,
        get: function(val){
            return moment(val).format('DD-MM-YYYY')
        }
    }
});

module.exports = mongoose.model('Transaction', transactionSchema);