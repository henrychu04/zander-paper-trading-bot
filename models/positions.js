const mongoose = require('mongoose');

const positionsSchema = mongoose.Schema({
  d_id: String,
  positionsValue: Number,
  positions: [Object],
});

module.exports = mongoose.model('Positions', positionsSchema, 'positions');
