const OpenOrders = require('../models/openOrders');

exports.run = async (client, message, args) => {
  let allOpenOrders = await OpenOrders.find({ d_id: message.author.id });

  let ordersString = 'Open Order(s):\n';
  let number = 0;
  let count = 0;

  for (let order of allOpenOrders[0].openOrders) {
    ordersString += `${stringifyOrder(order)}\n`;

    count++;
    number++;

    if (count == 10) {
      await message.channel.send('```' + ordersString + '```');

      ordersString = '';
      count = 0;
    }
  }

  if (number == 0) {
    await message.channel
      .send('```User does not have any open orders, returning```')
      .then(console.log(`${message} completed\n`));
    return;
  }

  await message.channel.send('```' + ordersString + '```').then(console.log(`${message} completed\n`));
};

function stringifyOrder(order) {
  let orderString = '';

  orderString += `\tTicker: ${order.ticker}\n\tOrder Type: ${order.orderType}\n\tMarket Type: ${order.marketType}\n\tVolume: ${order.volume}\n\tUSD Amount: ${order.usdAmount}\n\tLimit Price: ${order.limitPrice}\n`;

  return orderString;
}
