const OpenOrders = require('../models/openOrders');

exports.run = async (client, message, args) => {
  let allOpenOrders = await OpenOrders.find({ d_id: message.author.id });

  let limitOrders = [];
  let limitOrdersString = 'Open Limit Order(s):\n';
  let count = 0;
  let number = 0;

  for (let order of allOpenOrders[0].openOrders) {
    if (order.marketType == 'limit') {
      limitOrdersString += `Number: ${number}\n${stringifyOrder(order)}\n`;

      count++;
      number++;

      if (count == 10) {
        await message.channel.send('```' + limitOrdersString + '```');

        limitOrdersString = '';
        count = 0;
      }

      limitOrders.push(order);
    }
  }

  if (number == 0) {
    await message.channel.send('```User does not have any open limit orders, returning```');
    return;
  }

  await message.channel.send('```' + limitOrdersString + '```');
  await message.channel.send('```Enter order number(s) to cancel```');

  let stopped = false;
  let exit = false;
  let all = false;
  let nums = [];

  const collector = message.channel.createMessageCollector((msg) => msg.author.id == message.author.id, {
    time: 60000,
  });

  for await (const msg of collector) {
    nums = msg.content.split(' ');

    if (msg.content.toLowerCase() == 'n') {
      collector.stop();
      stopped = true;
      exit = true;
      console.log('Canceled\n');
    } else if (checkNumParams(nums)) {
      if (nums[0].toLowerCase() == 'all') {
        collector.stop();
        all = true;
        stopped = true;
      } else {
        let valid = true;

        for (let crnt of nums) {
          if (parseInt(crnt) >= limitOrders.length) {
            valid = false;
            await msg.channel.send(
              '```One or more entered limit order number(s) do not exist\nPlease enter existing order numbers(s)```'
            );
            break;
          }
        }

        if (valid) {
          collector.stop();
          stopped = true;
        }
      }
    } else {
      await msg.channel.send('```' + `Invalid format\nEnter 'all' or order number(s)` + '```');
    }
  }

  if (exit) {
    await message.channel.send('```Command canceled```');
    console.log('Command canceled\n');
    return;
  } else if (!stopped) {
    await message.channel.send('```Command timed out```');
    console.log('Command timed out\n');
  }

  let msg = await message.channel.send('```Canceling limit order(s) ... ```');

  try {
    await pullOrders(all, limitOrders, nums, msg, message.author.id).then(console.log(`${message} completed\n`));
  } catch (err) {
    console.log(err);
  }
};

async function pullOrders(all, limitOrders, nums, msg, d_id) {
  if (all) {
    for (let order of limitOrders) {
      await OpenOrders.updateOne({ d_id: d_id }, { $pull: { openOrders: { orderId: order.orderId } } });
    }

    await msg.edit('```All limit order(s) successfully canceled```');
  } else {
    for (let num of nums) {
      await OpenOrders.updateOne({ d_id: d_id }, { $pull: { openOrders: { orderId: limitOrders[num].orderId } } });
    }

    await msg.edit('```Specified limit order(s) successfully canceled```');
  }
}

function stringifyOrder(order) {
  return `\tTicker: ${order.ticker}\n\tOrder Type: ${order.orderType}\n\tVolume: ${order.volume}\n\tUSD Amount: ${order.usdAmount}\n\tLimit Price: ${order.limitPrice}\n`;
}

function checkNumParams(nums) {
  if (nums.length == 1) {
    if (nums[0].toLowerCase() == 'all') {
      return true;
    } else if (!isNaN(nums[0])) {
      return true;
    } else {
      return false;
    }
  }

  for (let crnt of nums) {
    if (isNaN(crnt)) {
      return false;
    }
  }

  return true;
}
