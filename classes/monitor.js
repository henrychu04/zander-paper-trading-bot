const events = require('events');
const fetch = require('node-fetch');
const Binance = require('node-binance-api');
const sleep = require('../../scripts/sleep.js');

const Users = require('../models/users.js');

const oneMinute = 60000;

module.exports = class Monitor extends events {
  constructor(client) {
    super();

    this.client = client;

    this.monitor();
  }

  monitor = async () => {
    while (1) {
      try {
      } catch (err) {
        console.log(err);
      }

      await sleep(oneMinute);
    }
  };
};
