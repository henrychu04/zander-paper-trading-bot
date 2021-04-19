const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  d_id: String,
  usdAmount: Number,
  portfolioValue: Number,
  positions: [],
  // {
  //   ticker: String,
  //   cost: Number,
  //   openVolume: Number,
  //   enterPrice: Number,
  //   type: String,
  //   stopLimit: Number,
  //   PNL: Number,
  // },
  openOrders: [],
  // {
  //   ticker: String,
  //   type: String,
  //   enterPrice: Number,
  //   openVolume: Number,
  // },
});

module.exports = mongoose.model('User', userSchema, 'users');
