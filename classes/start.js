const Monitor = require('./monitor.js');
const executeOrder = require('../scripts/executeOrder.js');

module.exports = async () => {
  let monitor = new Monitor();

  console.log('Monitor started ...\n');

  monitor.on('newOrder', (order, d_id) => {
    if (order.marketType == 'market') {
      console.log(`d_id: ${d_id}\nNew Market Order`);
    } else {
      console.log(`d_id: ${d_id}\nNew Limit Order`);
    }

    executeOrder(order, d_id);
  });
};
