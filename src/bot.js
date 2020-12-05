const { Client, ClientPresence } = require("discord.js");
require("dotenv").config();

const client = new Client();
const axios = require("axios");

const myAxios = axios.create({
	baseURL: "https://api.themoviedb.org/3",
});

client.login(process.env.DISCORD_BOT_TOKEN);
client.on("ready", () =>
	console.log(`${client.user.tag} is online and ready to go!!`)
);
const botCommandStarter = "!";

// callback function for message event
const interact = (message) => {
	if (message.content.toLowerCase() === "hey") {
		//  the initial greet message
		const greet = `Hey there ${message.author.username}. I am ${client.user.tag} and <@${process.env.KINGJAMES_ID}> created me.
I am still in the development phase. Try giving commands to me.. My commands should start with \`${botCommandStarter}\`.
Now type \`!commands\``;
		// send the message
		message.channel.send(greet);
	} else if (message.content.startsWith(botCommandStarter)) {
		// main commands
		const command = message.content.split(botCommandStarter).slice(1).join("");
		if (command === "commands")
			message.channel.send(`A list of my commands :
	1) !tv (name of the show)
	2) !movie (name of the movie)
	3) greet me with a hey`);
		// searching for movie or a tv show
		else if (command.toLowerCase().startsWith("movie"))
			search("movie", command.split(" ").slice(1).join(" "), message);
		else if (command.toLowerCase().startsWith("tv"))
			search("tv", command.split(" ").slice(1).join(" "), message);
		else
			message.channel.send(
				`I don't know how to handle the ${command} command! :(`
			);
	} else return;
};

async function search(media, name, message) {
	try {
		const res = await myAxios.get(
			`/search/${media}?api_key=${process.env.TMDB_KEY}&query=${name
				.split(" ")
				.join("+")}`
		);
		const mainResult = res.data.results[0];
		if (mainResult) {
			const imageUrl = `${process.env.IMG_LINK}${mainResult.poster_path}`;
			message.reply(
				`
Name of the ${media === "tv" ? "TV Show" : media} : **${
					mainResult.name || mainResult.title
				}**

Overview : ${mainResult.overview}

Released On : **${mainResult.first_air_date || mainResult.release_date}**

`,
				{ files: [imageUrl] }
			);
		} else {
			message.reply(`No ${media === "tv" ? "TV Show" : media} named ${name}.`);
		}
	} catch (error) {
		console.log(error);
	}
}

client.on("message", interact);
