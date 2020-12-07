const { Client } = require("discord.js");
require("dotenv").config();
const axios = require("axios");

const client = new Client();

const myAxios = axios.create({
	baseURL: "https://api.themoviedb.org/3",
});

let prev = {};

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
		const command = message.content.slice(1).toLowerCase();

		// knowing the commands
		if (command === "commands")
			message.channel.send(`A list of my commands :
	1) \`!tv\` [name of the show]
	2) \`!movie\` [name of the movie]
	3) \`!wrong\` (if the result was wrong)
	4) \`![number]\` (your choice)
	5) \`!list\` (to see the list of results)
	6) \`!BrBa\` (to get a random Breaking Bad quote)
	7) \`!got\` (to get a random Game Of Thrones quote)
	8) \`!line\` (for a random movie line)
	9) \`!anime\` (for a random anime line)
	10) \`!anime [name of the anime]\` (for an anime-specific quote)
	`);
		// empty string
		else if (command === "")
			message.channel.send(`There was no command, ${message.author.username}.`);
		// breaking bad quotes
		else if (command === "brba") breakingBadQuote(message);
		// Game of thrones quotes
		else if (command === "got") gotQuote(message);
		// anime quotes
		else if (command.startsWith("anime")) handleAnime(message, command);
		// searching for movie or a tv show
		else if (command.startsWith("movie"))
			search("movie", command.split(" ").slice(1).join(" "), message);
		else if (command.startsWith("tv"))
			search("tv", command.split(" ").slice(1).join(" "), message);
		// handling a wrong command
		else if (command === "wrong")
			prev[message.channel.id]
				? handleWrong(prev[message.channel.id], message, false)
				: noPrevError(message);
		// handling the list command
		else if (command === "list")
			prev[message.channel.id]
				? handleWrong(prev[message.channel.id], message, true)
				: noPrevError(message);
		// handling the options
		// giving choice without a prev result
		else if (!prev[message.channel.id] && parseInt(command))
			noPrevError(message);
		// invalid options
		else if (
			(prev[message.channel.id] &&
				parseInt(command) > prev[message.channel.id].length) ||
			parseInt(command) === 0
		)
			message.reply(
				`Are you messing with me?!\nIf not, choose an option __between 1 and ${
					prev[message.channel.id].length
				}__.`
			);
		// valid options
		else if (prev[message.channel.id] && parseInt(command) > 0)
			returnCorrect(parseInt(command), prev[message.channel.id], message);
		// invalid command
		else
			message.channel.send(
				`I don't know how to handle the __**${command}**__ command! 😒😒`
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
		// extracting the first element of the array (mostly correct)
		const mainResult = res.data.results[0];
		// storing the results in a global variable for further use
		console.log(message.channel.id);
		prev[message.channel.id] = res.data.results;
		if (mainResult) {
			sendMovie(mainResult, message);
		} else {
			message.reply(
				`No ${
					media === "tv" ? "TV Show" : media
				} named ${name}.:face_with_raised_eyebrow:`
			);
		}
	} catch (error) {
		message.channel.send(
			"There was an api error! :confused:, Try after some time!"
		);
		console.log(error);
	}
}

// handling the wrong results by showing a number of other results
function handleWrong(movies, message, isCorrect) {
	// user has given wrong when there was only a single result received.
	if (movies.length === 1) {
		message.reply(
			"That was the only result I got. Sorry, I'd rather suggest you watch some popular ones xD."
		);
		return;
	}
	let text = `Wasn't the result you expected 🤔🤔?? pas de probleme!\nNow here are the list of results that I got, just give me the serial number and you are good to go. 
	`;
	// differentiating a list command from a wrong command
	isCorrect ? (text = `Here are the list of results\n	`) : "";

	// adding every movie to the text string
	movies.forEach((movie, index) => {
		text += `${index + 1}) ${movie.title || movie.name} (${
			movie.release_date || movie.first_air_date
		})
	`;
	});

	message.reply(text);
}

// function to send a movie detail as messsage
function sendMovie(movie, message) {
	const imageUrl = `${process.env.IMG_LINK}${movie.poster_path}`;
	const isTV = movie.first_air_date ? true : false;
	const isAnime = isTV && movie.original_language === "ja";
	const compiledText = `
Name of the ${isAnime ? "Anime" : isTV ? "TV show" : "Movie"} : **${
		movie.name || movie.title
	}**

Overview : ${movie.overview}

${isTV ? "First Air Date" : "Released On"} : **${
		movie.first_air_date || movie.release_date
	}**

`;
	message.reply(compiledText, { files: [imageUrl] });
}

function noPrevError(message) {
	message.reply("Search for a movie or tv show first, then go for the choice!");
}

// calling the sendMovie function with the correct choice
function returnCorrect(choice, movies, message) {
	sendMovie(movies[choice - 1], message);
}

// sending a random Breaking Bad quote
async function breakingBadQuote(message) {
	try {
		const returnedValue = await axios.get(
			"https://breaking-bad-quotes.herokuapp.com/v1/quotes"
		);
		const result = returnedValue.data[0];
		message.channel.send(`"${result.quote}" - **${result.author}**.`);
	} catch (error) {
		console.log(error);
		message.channel.send("There was an error with the api :confused:");
	}
}

// send a random Game of thrones quote
async function gotQuote(message) {
	try {
		const returnedValue = await axios.get(
			"https://game-of-thrones-quotes.herokuapp.com/v1/random"
		);
		const data = returnedValue.data;
		message.channel.send(`"${data.sentence}" - **${data.character.name}**.`);
	} catch (error) {
		console.log(error);
		message.channel.send("There was an error with the api :confused:");
	}
}

// send a random anime quote
async function randomAnimeQuote(message) {
	try {
		const returnedValue = await axios.get(
			"https://animechanapi.xyz/api/quotes/random"
		);
		const data = returnedValue.data.data[0];
		message.channel.send(
			`"${data.quote}" - **${data.character}**.\n\nFrom *${data.anime}*.`
		);
	} catch (error) {
		console.log(error);
		message.channel.send("There was an error with the api :confused:");
	}
}

// send a quote from the specified anime
async function animeQuote(message, query) {
	const randomPage = parseInt(Math.random() * 9) + 1;
	try {
		const returnedValue = await axios.get(
			`https://animechanapi.xyz/api/quotes?anime=${query}&page=${randomPage}`
		);
		const data = returnedValue.data.data[0];
		console.log(data);
		message.channel.send(`"${data.quote}" - **${data.character}**.`);
	} catch (error) {
		console.log(error);
		message.channel.send(
			`There was an error with the api :confused:. Try giving the exact name of the anime. Are you sure it is only '${query}' `
		);
	}
}

// handling the !anime command
function handleAnime(message, command) {
	const query = command.split(" ").slice(1).join(" ");
	if (!query) randomAnimeQuote(message);
	else if (query) animeQuote(message, query);
}

// main messageEvent listener
client.on("message", interact);
