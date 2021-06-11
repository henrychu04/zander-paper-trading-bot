const Users = require('../models/users');

exports.run = async (client, message, args) => {
  let allUsersArray = await Users.find();

  let sorted = mergeSort(allUsersArray, 0, allUsersArray.length - 1);

  let rankingString = 'Rankings:\n';
  let count = 0;
  let number = 1;

  for (let user of sorted) {
    rankingString += `Number: ${number}\n${stringifyUser(user)}\n`;

    count++;
    number++;

    if (count == 11) {
      await message.channel.send('```' + rankingString + '```');

      rankingString = '';
      count = 1;
    }
  }

  await message.channel.send('```' + rankingString + '```').then(console.log(`${message} completed\n`));
};

function stringifyUser(user) {
  return `\tUser: ${user.username}\n\tPortfolio Value: ${user.portfolioValue}\n`;
}

function mergeSort(arr, l, r) {
  if (l >= r) {
    return arr;
  }

  var m = l + parseInt((r - l) / 2);

  mergeSort(arr, l, m);
  mergeSort(arr, m + 1, r);
  merge(arr, l, m, r);
}

function merge(arr, l, m, r) {
  var n1 = m - l + 1;
  var n2 = r - m;

  var L = new Array(n1);
  var R = new Array(n2);

  for (var i = 0; i < n1; i++) L[i] = arr[l + i];
  for (var j = 0; j < n2; j++) R[j] = arr[m + 1 + j];

  var i = 0;
  var j = 0;
  var k = l;

  while (i < n1 && j < n2) {
    if (L[i].portfolioValue <= R[j].portfolioValue) {
      arr[k] = L[i];
      i++;
    } else {
      arr[k] = R[j];
      j++;
    }
    k++;
  }

  while (i < n1) {
    arr[k] = L[i];
    i++;
    k++;
  }

  while (j < n2) {
    arr[k] = R[j];
    j++;
    k++;
  }
}
