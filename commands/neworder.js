const Binance = require('node-binance-api');
const Discord = require('discord.js');
const { v4: uuidv4 } = require('uuid');

const Users = require('../models/users.js');
const OpenOrders = require('../models/openOrders.js');
const Positions = require('../models/positions.js');

exports.run = async (client, message, args) => {
  if (args.length == 0) {
    message.channel.send('```Command requires an order string```');
    console.log('Command not executed\n');
    return;
  }

  let user = await initModels(message.author.id);

  const binance = new Binance();

  let orderObj = await parseInput(binance, message, args, user);

  if (orderObj == null) {
    return;
  }

  const orderEmbed = new Discord.MessageEmbed()
    .setColor('#7756fe')
    .setTitle(`New Order`)
    .addFields(
      { name: 'Ticker', value: orderObj.ticker, inline: true },
      { name: 'Current Price', value: orderObj.crntPrice, inline: true },
      { name: 'Order Type', value: orderObj.orderType, inline: true },
      { name: 'Market Type', value: orderObj.marketType, inline: true },
      { name: 'Volume', value: orderObj.volume, inline: true },
      { name: 'USD Amount', value: orderObj.usdAmount, inline: true },
      { name: 'Limit Price', value: `${orderObj.limitPrice ? orderObj.limitPrice : 'N/A'}`, inline: true }
    );

  await message.channel.send(orderEmbed);
  await message.channel.send('```' + `Confirm order: 'y', 'n'` + '```');

  let stopped = false;
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

  if (!res) {
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

async function parseInput(binance, message, args, user) {
  let date = new Date();

  let orderObj = {
    orderId: uuidv4(),
    time: date.getTime(),
    ticker: '',
    orderType: '',
    volume: '',
    volumeOrder: false,
    marketType: '',
    crntPrice: '',
    usdAmount: '',
    limitPrice: '',
  };

  let splitMessage = args[0].split(':');

  if (splitMessage.length != 5 && splitMessage.length != 4) {
    message.channel.send('```Incorrect number of order parameters, returning...```');
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
    } else {
      crnt = obj;
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
    orderObj.usdAmount = Number(paramVolume).toFixed(5);
    orderObj.volume = Number(paramVolume / orderObj.crntPrice).toFixed(5);
  } else {
    orderObj.volumeOrder = true;
    orderObj.volume = Number(paramVolume).toFixed(5);
    orderObj.usdAmount = `${Number(paramVolume * orderObj.crntPrice).toFixed(5)}`;
  }

  let allPositions = await Positions.find({ d_id: user.d_id });

  let existingPosition = false;
  let newVolume = 0;

  if (allPositions.length != 0) {
    for (let position of allPositions[0].positions) {
      if (position.ticker == orderObj.ticker) {
        existingPosition = true;

        if (position.volume > 0 && orderObj.orderType == 'sell') {
          newVolume = orderObj.orderType - position.volume;
        }
        break;
      }
    }
  }

  if (newVolume < 0) {
    await message.channel.send('```User does not have enough spot volume to sell```');
    return null;
  }

  if (!existingPosition && user.freeUsdAmount < orderObj.usdAmount) {
    await message.channel.send('```User does not enough free USD to execute order```');
    return null;
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

async function initModels(d_id) {
  let allHistoricalOrders = await HistoricalOrders.find({ d_id: d_id });
  let allPositions = await Positions.find({ d_id: d_id });
  let allUsers = await Users.find({ d_id: d_id });

  if (allHistoricalOrders.length == 0) {
    const newHistoricalOrders = new HistoricalOrders({
      d_id: d_id,
      historicalOrders: [],
    });

    await newHistoricalOrders.save();
  }

  if (allPositions.length == 0) {
    const newPositions = new Positions({
      d_id: d_id,
      positionsValue: 0,
      positions: [],
    });

    await newPositions.save();
  }

  if (allUsers.length == 0) {
    const newUser = new Users({
      d_id: message.author.id,
      usdAmount: 100000,
      portfolioValue: 100000,
    });

    await newUser.save().then(console.log('New user successfully added'));

    allUsers = await Users.find({ d_id: d_id });
  }

  return allUsers[0];
}
