const mongoose = require('mongoose');

const tradeInSchema = new mongoose.Schema({
  brand: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    required: true,
    trim: true
  },
  scratches: {
    type: String,
    required: true,
    enum: ['None', 'Light', 'Heavy'],
    default: 'None'
  },
  status: {
    type: String,
    enum: ['Pending Evaluation', 'Approved', 'Rejected', 'Completed'],
    default: 'Pending Evaluation'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('TradeIn', tradeInSchema);
