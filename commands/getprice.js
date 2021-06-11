const Discord = require('discord.js');
const Binance = require('node-binance-api');

exports.run = async (client, message, args) => {
  if (args.length != 1) {
    await message.channel.send('```Command requires a ticker```');
    console.log('Command requires a ticker\n');
    return;
  }

  let passedInTicker = args[0];

  const binance = new Binance();

  let allPrices = await binance.futuresPrices();
  let exist = false;
  let ticker = '';
  let price = 0;

  for (let obj of Object.keys(allPrices)) {
    let crnt = obj.replace('USDT', '');

    if (crnt.toLowerCase() == passedInTicker) {
      exist = true;
      ticker = obj;
      price = allPrices[obj];
      break;
    }
  }

  if (!exist) {
    await message.channel.send('```Ticker does not exist```');
    console.log('Ticker does not exist');
    return;
  }

  const embed = new Discord.MessageEmbed()
    .setColor('#7756fe')
    .setTitle(`${ticker} Price`)
    .setDescription(`${ticker} - ${price}`);

  await message.channel.send(embed).then(console.log(`${message} completed\n`));
};
