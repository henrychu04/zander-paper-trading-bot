const Binance = require('node-binance-api');

const Users = require('../models/users');
const OpenOrders = require('../models/openOrders');
const HistoricalOrders = require('../models/historicalOrders');
const Positions = require('../models/positions');

const marketFee = 0.005;
const limitFee = 0.003;

module.exports = async (order, d_id) => {
  try {
    await update(d_id, order).then(() => {
      if (order.marketType == 'market') {
        console.log('Market Order Executed\n');
      } else {
        console.log('Limit Order Executed\n');
      }
    });
  } catch (err) {
    console.log(err);
  }
};

async function update(d_id, order) {
  await OpenOrders.updateOne({ d_id: d_id }, { $pull: { openOrders: { orderId: order.orderId } } });

  const binance = new Binance();
  let allPrices = await binance.futuresPrices();
  order.crntPrice = Number(allPrices[order.ticker]);

  if (!order.volumeOrder) {
    order.volume = Number(order.usdAmount / order.crntPrice);
  } else {
    order.usdAmount = Number(order.crntPrice * order.volume);
  }

  if (order.orderType == 'market') {
    order.fee = Number(order.usdAmount * marketFee);
  } else {
    order.fee = Number(order.usdAmount * limitFee);
  }

  let date = new Date();
  order.time = date.getTime();

  await HistoricalOrders.updateOne({ d_id: d_id }, { $push: { historicalOrders: order } });

  let allPositions = await Positions.find({ d_id: d_id });
  let userPositions = allPositions[0].positions;
  let exist = false;

  for (let position of userPositions) {
    if (position.ticker == order.ticker) {
      exist = true;
      let newVolume = 0;

      if (order.orderType == 'buy') {
        newVolume = Number(position.volume + order.volume);
      } else {
        newVolume = Number(position.volume - order.volume);
      }

      if (newVolume == 0) {
        await Users.updateOne({ d_id: d_id }, { $inc: { usdAmount: Number(position.usdAmount - order.fee) } });
        await Positions.updateOne({ d_id: d_id }, { $pull: { positions: { 'positions.ticker': order.ticker } } });
      } else {
        let depositAmount = Number(order.volume * order.crntPrice - order.fee);
        if (order.orderType == 'buy') depositAmount *= -1;
        await Users.updateOne({ d_id: d_id }, { $inc: { usdAmount: depositAmount } });
        await Positions.updateOne(
          { d_id: d_id, 'positions.ticker': order.ticker },
          { $set: { 'positions.$.volume': newVolume } }
        );
      }
      break;
    }
  }

  if (!exist) {
    let newPosition = {
      ticker: order.ticker,
      volume: order.volume,
      usdAmount: order.usdAmount,
    };

    await Positions.updateOne({ d_id: d_id }, { $push: { positions: newPosition } });
  }
}
