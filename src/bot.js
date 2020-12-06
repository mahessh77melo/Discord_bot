const { Client, ClientPresence } = require("discord.js");
require("dotenv").config();

const client = new Client();
const axios = require("axios");

const myAxios = axios.create({
	baseURL: "https://api.themoviedb.org/3",
});

let prev;

client.login(process.env.DISCORD_BOT_TOKEN);
client.on("ready", () => {
	client.user.setPresence({
		activity: { name: "out for !commands", type: "WATCHING" },
		status: "online",
	});
	console.log(`${client.user.tag} is online and ready to go!!`);
});
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
		const command = message.content
			.split(botCommandStarter)
			.slice(1)
			.join("")
			.toLowerCase();
		if (command === "commands")
			message.channel.send(`A list of my commands :
	1) \`!tv\` (name of the show)
	2) \`!movie\` (name of the movie)
	3) \`!wrong\` (if the result was wrong)
	4) \`!(number)\` (your choice)
	4) greet me with a \`hey\`
	`);
		// empty string
		else if (command === "")
			message.channel.send(`There was no command, ${message.author.username}.`);
		// searching for movie or a tv show
		else if (command.startsWith("movie"))
			search("movie", command.split(" ").slice(1).join(" "), message);
		else if (command.startsWith("tv"))
			search("tv", command.split(" ").slice(1).join(" "), message);
		else if (command === "wrong") handleWrong(prev, message);
		else if (parseInt(command) > prev.length || parseInt(command) === 0)
			message.reply(`Are you messing with me?!
If not, choose an option between 1 and ${prev.length}.`);
		else if (parseInt(command) > 0)
			returnCorrect(parseInt(command), prev, message);
		else
			message.channel.send(
				`I don't know how to handle the **${command}** command! 😒😒`
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
		prev = res.data.results;
		if (mainResult) {
			sendMovie(mainResult, message);
		} else {
			message.reply(`No ${media === "tv" ? "TV Show" : media} named ${name}.`);
		}
	} catch (error) {
		console.log(error);
	}
}

function handleWrong(movies, message) {
	let text = `Wasn't the result you expected 🤔🤔?? pas de probleme!
Now here are the list of results that I got, just give me the serial number and you are good to go. 
	`;
	movies.forEach((movie, index) => {
		text += `${index + 1}) ${movie.title || movie.name} (${
			movie.release_date || movie.first_air_date
		})
	`;
	});
	message.reply(text);
}

function sendMovie(movie, message) {
	const imageUrl = `${process.env.IMG_LINK}${movie.poster_path}`;
	message.reply(
		`
Name of the ${movie.media_type === "tv" ? "TV Show" : "Movie"} : **${
			movie.name || movie.title
		}**

Overview : ${movie.overview}

Released On : **${movie.first_air_date || movie.release_date}**

`,
		{ files: [imageUrl] }
	);
}

function returnCorrect(choice, movies, message) {
	sendMovie(movies[choice - 1], message);
}

client.on("message", interact);
