const { Client, ClientPresence } = require("discord.js");
require("dotenv").config();

const client = new Client();
client.login(process.env.DISCORD_BOT_TOKEN);
client.on("ready", () =>
	console.log(`${client.user.tag} is online and ready to go!!`)
);
const botCommandStarter = "!";

// callback function for message event
const interact = (message) => {
	if (message.content.toLowerCase() === "hey") {
		//  the initial greet message
		const greet = `Hey there ${message.author.username}. I am ${client.user.tag} and <@764089799907737620> created me.
I am still in the development phase. Try giving commands to me.. My commands should start with \`${botCommandStarter}\``;
		// send the message
		message.channel.send(greet);
	} else if (message.content.startsWith(botCommandStarter)) {
		// main commands
		const command = message.content.split(botCommandStarter).slice(1).join("");
		message.channel.send(`You have given the **${command}** command to me!`);
	} else return;
};

client.on("message", interact);
