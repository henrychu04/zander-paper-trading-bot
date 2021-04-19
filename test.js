const Binance = require('node-binance-api');

(async function main() {
  const binance = new Binance();

  let ticker = await binance.prices();
  console.info(`Price of BTCUSDT: ${ticker.BTCUSDT}`);

  let price = 0;

  //   while (price == 0) {
  await binance.prices('BTCUSDT', (error, ticker) => {
    price = ticker.BNBUSDT;
    console.info('Price of BTCUSDT in while loop: ', ticker.BTCUSDT);
  });
  //   }

  console.info('Price of BNB: ', price);
})();
