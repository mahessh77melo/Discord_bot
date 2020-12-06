const { Client } = require("discord.js");
require("dotenv").config();
const axios = require("axios");
const movieQuotes = require("movie-quotes");

const client = new Client();

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
	`);
		// empty string
		else if (command === "")
			message.channel.send(`There was no command, ${message.author.username}.`);
		// breaking bad quotes
		else if (command === "brba") breakingBadQuote(message);
		// Game of thrones quotes
		else if (command === "got") gotQuote(message);
		// random movie line
		else if (command === "line") movieQuote(message);
		// searching for movie or a tv show
		else if (command.startsWith("movie"))
			search("movie", command.split(" ").slice(1).join(" "), message);
		else if (command.startsWith("tv"))
			search("tv", command.split(" ").slice(1).join(" "), message);
		// handling a wrong command
		else if (command === "wrong") handleWrong(prev, message);
		// handling the list command
		else if (command === "list") handleWrong(prev, message, true);
		// handling the options
		// giving choice without a prev result
		else if (!prev && parseInt(command))
			message.reply(
				"Search for a movie or tv show first, then go for the choice!"
			);
		// invalid options
		else if (
			(prev && parseInt(command) > prev.length) ||
			parseInt(command) === 0
		)
			message.reply(
				`Are you messing with me?!\nIf not, choose an option __between 1 and ${prev.length}__.`
			);
		// valid options
		else if (prev && parseInt(command) > 0)
			returnCorrect(parseInt(command), prev, message);
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
		prev = res.data.results;
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
	const compiledText = `
Name of the ${movie.media_type === "tv" ? "TV Show" : "Movie"} : **${
		movie.name || movie.title
	}**

Overview : ${movie.overview}

${movie.media_type === "tv" ? "First Air Date" : "Released On"} : **${
		movie.first_air_date || movie.release_date
	}**

`;
	message.reply(compiledText, { files: [imageUrl] });
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

// send a random movie quote
async function movieQuote(message) {
	const quote = movieQuotes.random();
	console.log(movieQuotes.all);
	message.channel.send(quote);
}

// main messageEvent listener
client.on("message", interact);
