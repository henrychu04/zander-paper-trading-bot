const Binance = require('node-binance-api');
const Discord = require('discord.js');

const Users = require('../models/users.js');
const OpenOrders = require('../models/openOrders.js');

exports.run = async (client, message, args) => {
  if (args.length == 0) {
    message.channel.send('```Command requires an order string```');
    console.log('Command not executed\n');
    return;
  }

  let allUsers = await Users.find({ d_id: message.author.id });

  if (allUsers.length == 0) {
    const newUser = new Users({
      d_id: message.author.id,
      usdAmount: 100000,
      portfolioValue: 100000,
    });

    await newUser
      .save()
      .then(console.log('New user successfully added'))
      .catch((err) => {
        throw new Error(err);
      });

    allUsers = await Users.find({ d_id: message.author.id });
  }

  let user = allUsers[0];

  const binance = new Binance();

  // BTC:buy:$50:market
  // BtC:buy:50:limit:60000

  let orderObj = await parseInput(binance, message, args);

  if (orderObj == null) {
    return;
  }

  const orderEmbed = new Discord.MessageEmbed()
    .setColor('#7756fe')
    .setTitle(`New Order`)
    .addFields(
      { name: 'Ticker', value: orderObj.ticker },
      { name: 'Current Price', value: orderObj.crntPrice },
      { name: 'Order Type', value: orderObj.orderType },
      { name: 'Market Type', value: orderObj.marketType },
      { name: 'Volume', value: orderObj.volume },
      { name: 'USD Amount', value: orderObj.usdAmount },
      { name: 'Limit Price', value: `${orderObj.limitPrice != '' ? orderObj.limitPrice : 'N/A'}` }
    );

  await message.channel.send(orderEmbed);
  await message.channel.send('```' + `Confirm order: 'y', 'n'` + '```');

  let stopped = false;
  let exit = false;
  let res = false;

  const collector = message.channel.createMessageCollector((msg) => msg.author.id == message.author.id, {
    time: 30000,
  });

  for await (const msg of collector) {
    if (msg.content.toLowerCase() == 'y') {
      stopped = true;
      res = true;
      break;
    } else if (msg.content.toLowerCase() == 'n') {
      stopped = true;
      break;
    }
  }

  if (exit || !res) {
    await message.channel.send('```Command canceled```');
    console.log('Command canceled\n');
    return;
  } else if (!stopped) {
    await message.channel.send('```Command timed out```');
    console.log('Command timed out\n');
    return;
  }

  await addNewOrder(user, orderObj);

  await message.channel.send('```New Order Successfully Submitted```').then(console.log('New order submitted\n'));
};

async function addNewOrder(user, orderObj) {
  let allOpenOrdersUsers = await OpenOrders.find({ d_id: user.d_id });

  if (allOpenOrdersUsers.length == 0) {
    const newOpenOrderUser = new OpenOrders({
      d_id: user.d_id,
      openOrders: [orderObj],
    });

    await newOpenOrderUser
      .save()
      .then(console.log('New open order user successfully added\n'))
      .catch((err) => {
        throw new Error(err);
      });
  } else {
    await OpenOrders.updateOne({ d_id: user.d_id }, { $push: { openOrders: orderObj } })
      .then(console.log('New open order successfully added\n'))
      .catch((err) => console.log(err));
  }
}

async function parseInput(binance, message, args) {
  let orderObj = {
    ticker: '',
    orderType: '',
    volume: '',
    marketType: '',
    crntPrice: '',
    usdAmount: '',
    limitPrice: '',
  };

  let splitMessage = args[0].split(':');

  if (splitMessage.length != 5) {
    message.channel.send('```Incorrect number of order parameters, returning...');
    return null;
  }

  let ticker = splitMessage[0].toLowerCase();
  let orderType = splitMessage[1].toLowerCase();
  let paramVolume = splitMessage[2];
  let marketType = splitMessage[3].toLowerCase();
  let limitPrice = splitMessage[4];

  let allPrices = await binance.futuresPrices();
  let exist = false;

  for (let obj of Object.keys(allPrices)) {
    let crnt = '';

    if (!ticker.includes('USDT')) {
      crnt = obj.replace('USDT', '');
    }

    if (crnt.toLowerCase() == ticker) {
      exist = true;
      orderObj.ticker = obj;
      orderObj.crntPrice = allPrices[obj];
      break;
    }
  }

  if (!exist) {
    await message.channel.send('```Ticker does not exist```');
    return null;
  }

  if (orderType != 'buy' && orderType != 'sell') {
    await message.channel.send('```Invalid order```');
    return null;
  } else {
    orderObj.orderType = orderType;
  }

  if (paramVolume.includes('$')) {
    paramVolume = paramVolume.replace('$', '');
    orderObj.usdAmount = paramVolume.toLocaleString();
    orderObj.volume = paramVolume / orderObj.crntPrice;
  } else {
    orderObj.volume = paramVolume;
    orderObj.usdAmount = `$${(paramVolume * orderObj.crntPrice).toLocaleString()}`;
  }

  if (isNaN(paramVolume)) {
    await message.channel.send('```Invalid volume amount```');
    return null;
  }

  if (marketType != 'market' && marketType != 'limit') {
    await message.channel.send('```Invalid order type```');
    return null;
  } else {
    orderObj.marketType = marketType;
  }

  if (marketType == 'limit' && (limitPrice == undefined || isNaN(limitPrice))) {
    await message.channel.send('```Invalid limit order```');
    return null;
  } else {
    orderObj.limitPrice = limitPrice;
  }

  return orderObj;
}
