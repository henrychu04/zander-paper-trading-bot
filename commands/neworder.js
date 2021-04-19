const Binance = require('node-binance-api');

const Users = require('../models/users.js');

exports.run = async (client, message, args) => {
  let allUsers = await Users.find({ d_id: message.author.id });

  if (allUsers.length == 0) {
    const newUser = new Users({
      d_id: message.author.id,
      usdAmount: 100000,
      portfolioValue: 100000,
      positions: [],
      openOrders: [],
    });

    await newUser
      .save()
      .then(console.log('New user successfully added'))
      .catch((err) => {
        throw new Error(err);
      });

    allUsers = await Users.find({ d_id: message.author.id });
  }

  let crntUser = allUsers[0];

  const binance = new Binance();
  let allPrices = await binance.futuresPrices();

  // BTC:buy:$50:market
  // BtC:buy:50:limit:60000

  let orderObj = await parseInput(binance, message, args);

  if (orderObj == null) {
    return;
  }

  const embed = new Discord.MessageEmbed()
    .setColor('#7756fe')
    .setTitle(`New Order`)
    .addFields(
      { name: 'Ticker', value: orderObj.ticker },
      { name: 'Order Type', value: orderObj.orderType },
      { name: 'Volume', value: orderObj.volume },
      { name: 'Volume', value: orderObj.volume }
    );

  await message.channel.send('```' + `Confirm order: 'y', 'n'` + '```');

  let stopped = false;
  let exit = false;
  let all = false;
  let nums = [];

  const collector = message.channel.createMessageCollector((msg) => msg.author.id == message.author.id, {
    time: 30000,
  });

  for await (const msg of collector) {
  }

  if (exit) {
    returnObj.returnedEnum = response.EXIT;
    return returnObj;
  } else if (!stopped) {
    returnObj.returnedEnum = response.TIMEOUT;
    return returnObj;
  }
};

async function parseInput(binance, message, args) {
  let orderObj = {
    ticker: '',
    orderType: '',
    volume: '',
    crntPrice: '',
    marketType: '',
    limitPrice: '',
    usd: false,
  };

  let splitMessage = args[0].split(':');
  let ticker = splitMessage[0].toLowerCase();
  let orderType = splitMessage[1].toLowerCase();
  let volume = splitMessage[2];
  let marketType = splitMessage[3].toLowerCase();
  let limitPrice = splitMessage[4];

  let allPrices = await binance.futuresPrices();
  let exist = false;

  for (let obj of Object.keys(allPrices)) {
    let crnt = obj.replace('USDT', '');

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

  if (volume.includes('$')) {
    orderObj.usd = true;
    volume = volume.replace('$', '');
  } else {
    orderObj.usd = false;
  }

  if (isNaN(volume)) {
    await message.channel.send('```Invalid volume amount```');
    return null;
  } else {
    orderObj.volume = volume;
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
