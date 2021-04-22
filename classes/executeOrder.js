const Users = require('../models/users.js');
const OpenOrders = require('../models/openOrders.js');
const HistoricalOrders = require('../models/historicalOrders.js');
const Positions = require('../models/positions.js');

const marketFee = 0.005;
const limitFee = 0.004;

module.exports = class executeOrder {
  marketOrder = async (order) => {};

  limitOrder = async (order) => {};
};
