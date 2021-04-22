const Monitor = require('./monitor.js');
const executeOrder = require('./executeOrder.js');

module.exports = async () => {
  let newMonitor = new Monitor();

  console.log('Monitor started ...\n');

  newMonitor.on('newLimitOrder', (order) => {
    executeOrder.limitOrder(order);
  });

  newMonitor.on('newMarketOrder', (order) => {
    executeOrder.marketOrder(order);
  });
};
