const mongoose = require('mongoose');

const openOrdersSchema = mongoose.Schema({
  d_id: String,
  historicalOrders: [Object],
});

module.exports = mongoose.model('HistoricalOrders', openOrdersSchema, 'historicalOrders');
