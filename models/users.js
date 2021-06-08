const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  d_id: String,
  usdAmount: Number,
  freeUsdAmount: Number,
  portfolioValue: Number,
});

module.exports = mongoose.model('User', userSchema, 'users');
