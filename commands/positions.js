const Positions = require('../models/positions');

exports.run = async (client, message, args) => {
  let positionArray = await Positions.find({ d_id: message.author.id });

  let positionsString = 'Positions(s):\n';
  let count = 0;
  let number = 0;

  for (let position of positionArray[0].positions) {
    positionsString += `${stringifyPosition(position)}\n`;

    count++;
    number++;

    if (count == 10) {
      await message.channel.send('```' + positionsString + '```');

      positionsString = '';
      count = 0;
    }
  }

  if (number == 0) {
    await message.channel
      .send('```User does not have any open limit orders, returning```')
      .then(console.log(`${message} completed\n`));
  } else {
    await message.channel.send('```' + positionsString + '```').then(console.log(`${message} completed\n`));
  }
};

function stringifyPosition(position) {
  return `\tTicker: ${position.ticker}\n\tVolume: ${position.volume}\n\tUSD Value: ${position.usdAmount}`;
}
