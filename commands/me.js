const User = require('../models/users');

exports.run = async (client, message, args) => {
  let userArray = await User.find({ d_id: message.author.id });
  let user = userArray[0];

  const userInfoEmbed = new Discord.MessageEmbed()
    .setColor('#7756fe')
    .setTitle(`${user.username} information`)
    .addFields(
      { name: 'USD Amount', value: user.usdAmount },
      { name: 'Free USD Amount', value: user.freeUsdAmount },
      { name: 'Portfolio Value', value: user.portfolioValue }
    );

  await message.channel.send(userInfoEmbed).then(console.log(`${message} completed\n`));
};
