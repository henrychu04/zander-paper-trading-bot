const Discord = require('discord.js');
const Binance = require('node-binance-api');

exports.run = async (client, message, args) => {
  const binance = new Binance();

  let allPrices = await binance.futuresPrices();

  const embed = new Discord.MessageEmbed().setColor('#7756fe').setTitle(`All Prices`);

  for (let ticker of Object.keys(allPrices)) {
    embed.addFields({ name: ticker, value: allPrices[ticker], inline: true });
  }

  await message.channel.send(embed).then(console.log('All prices embed sent\n'));
};
