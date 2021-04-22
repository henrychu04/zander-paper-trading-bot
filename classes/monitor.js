const events = require('events');
const Binance = require('node-binance-api');
const sleep = require('../scripts/sleep.js');

const OpenOrders = require('../models/openOrders.js');

const oneMinute = 60000;
const oneSecond = 1000;

module.exports = class Monitor extends events {
  binance = new Binance();

  constructor() {
    super();
    this.monitor();
  }

  monitor = async () => {
    while (1) {
      try {
        let allPrices = await this.binance.futuresPrices();
        let allOpenOrdersUsers = await OpenOrders.find();

        for (let user of allOpenOrdersUsers) {
          for (let order of user.openOrders) {
            for (let ticker of Object.keys(allPrices)) {
              if (ticker == order.ticker) {
                if (order.marketType == 'market') {
                  order.crntPrice = allPrices[ticker];
                  this.emit('newMarketOrder', order);
                } else {
                  if (order.type == 'buy' && order.limitPrice >= allPrices[ticker]) {
                    this.emit('newLimitOrder', order);
                  } else if (order.type == 'sell' && order.limitPrice <= allPrices[ticker]) {
                    this.emit('newLimitOrder', order);
                  }
                }
                break;
              }
            }
          }
        }
      } catch (err) {
        console.log(err);
      }

      await sleep(oneMinute);
    }
  };
};
