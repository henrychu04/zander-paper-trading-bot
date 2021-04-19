const monitor = require('./monitor.js');
const webhook = require('../scripts/webhook.js');

module.exports = async () => {
  let newMonitor = new monitor();

  console.log('Monitor started ...\n');

  newMonitor.on('newOrder', (user, body) => {
    if (user.webhook.length != 0) {
      webhook(user, body);
    }
  });
};
