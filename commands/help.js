exports.run = async (client, message, args) => {
  message.channel
    .send({
      embed: {
        title: 'Zander',
        description:
          'A crypto currency paper trading bot based in Discord. Available crypto currencies that can be traded are based on the Binance API.',
        color: '#7756fe',
        fields: [
          {
            name: ';me',
            value: 'User information',
          },
          {
            name: ';neworder',
            value:
              'Submit a new market or limit order\nFormat: ;neworder BTC:buy:$50:market OR ;neworder BTC:buy:1:limit:50000',
          },
          { name: ';allprices', value: 'Returns all current prices of tradable crypto currencies' },
          { name: ';getprice', value: 'Returns the prices of a specified crypto currency' },
          { name: ';openorder', value: 'Returns all open orders of a specified user' },
          { name: ';cancellimitorder', value: 'Cancels a limit order of a specified user' },
          { name: ';rankings', value: 'Current rankings of all users sorted by portfolio value' },
        ],
      },
    })
    .then(console.log(`${message} completed\n`));
};
