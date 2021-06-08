const events = require('events');
const Binance = require('node-binance-api');
const sleep = require('../scripts/sleep.js');

const Users = require('../models/users.js');
const OpenOrders = require('../models/openOrders.js');
const Positions = require('../models/positions.js');

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
        let allOpenOrders = await OpenOrders.find();
        let allPositions = await Positions.find();
        let allUsers = await Users.find();

        for (let user of allOpenOrders) {
          let cumLimitAmount = 0;

          for (let order of user.openOrders) {
            for (let ticker of Object.keys(allPrices)) {
              if (ticker == order.ticker) {
                if (order.marketType == 'market') {
                  this.emit('newOrder', order, user.d_id);
                } else {
                  cumLimitAmount += Number(order.usdAmount);

                  if (order.orderType == 'buy' && order.limitPrice >= allPrices[ticker]) {
                    this.emit('newOrder', order, user.d_id);
                  } else if (order.orderType == 'sell' && order.limitPrice <= allPrices[ticker]) {
                    this.emit('newOrder', order, user.d_id);
                  }
                }
                break;
              }
            }
          }

          for (let userInfo of allUsers) {
            if (userInfo.d_id == user.d_id) {
              await Users.updateOne({ d_id: user.d_id }, { freeUsdAmount: userInfo.usdAmount - cumLimitAmount });
              break;
            }
          }
        }

        for (let user of allPositions) {
          let newPositionsAmount = 0;

          for (let position of user.positions) {
            for (let ticker of Object.keys(allPrices)) {
              if (ticker == position.ticker) {
                let newUsdAmount = Number(allPrices[ticker]) * Number(position.volume);

                newPositionsAmount += newUsdAmount;

                await Positions.updateOne(
                  { d_id: user.d_id, 'positions.ticker': position.ticker },
                  { $set: { 'positions.$.usdAmount': newUsdAmount } }
                );
                break;
              }
            }
          }

          await Positions.updateOne({ d_id: user.d_id }, { $set: { positionsValue: Number(newPositionsAmount) } });

          for (let crnt of allUsers) {
            if (crnt.d_id == user.d_id) {
              await Users.updateOne(
                { d_id: user.d_id },
                { $set: { portfolioValue: (newPositionsAmount += crnt.usdAmount) } }
              );
              break;
            }
          }
        }
      } catch (err) {
        console.log(err);
      }

      await sleep(oneMinute);
      // await sleep(oneSecond);
    }
  };
};
