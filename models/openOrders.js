const mongoose = require('mongoose');

const openOrdersSchema = mongoose.Schema({
  d_id: String,
  openOrders: [Object],
});

module.exports = mongoose.model('OpenOrders', openOrdersSchema, 'openOrders');
