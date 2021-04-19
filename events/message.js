module.exports = (client, message) => {
  if (message.author.bot) return;

  const args = message.content.slice(client.config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  const cmd = client.commands.get(command);

  if (!cmd) return;

  console.log('User:', message.author.id);

  cmd.run(client, message, args);
};
