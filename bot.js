const { Client, MessageEmbed } = require("discord.js");
require("dotenv").config();
const axios = require("axios");

// creating a new client
const client = new Client();

// axios header for tmdb requests
const myAxios = axios.create({
	baseURL: "https://api.themoviedb.org/3",
});

// objects having the current search results of every channel
let current = {};

// API urls
const api_urls = {
	brba: "https://breaking-bad-quotes.herokuapp.com/v1/quotes",
	got: "https://game-of-thrones-quotes.herokuapp.com/v1/random",
	anime: "https://animechan.vercel.app/api",
};
// bot prefix
const botCommandStarter = "$";
// list of commands
const commandList = [
	"help",
	"commands",
	"brba",
	"anime",
	"got",
	"list",
	"wrong",
	"movie",
	"tv",
];

// bot is online
client.login(process.env.DISCORD_BOT_TOKEN);
// fire the callback once the bot is online
client.on("ready", () => {
	// setting up rich presence for the bot
	client.user.setPresence({
		activity: { name: "out for $commands", type: "WATCHING" },
		status: "online",
	});
	console.log(`${client.user.tag} is online and ready to go!!`);
});

/**
 * callback function for message event
 * @param {*} message
 * @returns null
 */
const interact = (message) => {
	if (message.content.startsWith(botCommandStarter)) {
		// slice out the '!' from the command
		const command = message.content.slice(1).toLowerCase();

		// about the bot
		if (command === "help") {
			//  the initial intro message
			const about = `Hey there ${message.author.username}. I am ${client.user.tag} and <@${process.env.KINGJAMES_ID}> developed me. As of now, I am capable of giving info about your favourite movies, shows or even animes. Want quotes from famous shows like *Breaking Bad* and *Game of Thrones*, just ask! Still haven't grown up and want some anime quotes? Try me !!!.`;

			// MessageEmbed - to send styled and formatted messages
			// Discord feature available only for bots
			const embed = new MessageEmbed()
				.setColor("#ffba08")
				.setTitle("The Movie Nerd")
				.setURL("https://github.com/mahessh77melo/Discord_bot")
				.setThumbnail(
					"https://logo-logos.com/wp-content/uploads/2018/03/discord_icon_logo_remix.png"
				)
				.setDescription(about)
				.addField(
					"Note",
					`My commands should start with \`${botCommandStarter}\`.\nNow type \`$commands\``,
					true
				);
			// send the message
			message.channel.send(embed);
		}

		// command for knowing the commands
		else if (command === "commands") {
			const embed = new MessageEmbed()
				.setColor("#06d6a0")
				.setTitle("List of my Commands")
				.setDescription(
					"Note that only the first word of the command is important, the rest of the command is your query and what you wish.\n"
				)
				.addFields(
					{ name: "Get a tv Show", value: "`$tv peaky blinders`" },
					{ name: "Get a Movie", value: "`$movie fight club`" },
					{ name: "Wrong result", value: "`$wrong`" },
					{ name: "Select the correct Choice", value: "`$5`" },
					{ name: "See all the results", value: "`$list`" },
					{ name: "Breaking Bad quote", value: "`$BrBa`" },
					{ name: "Game of thrones Quote", value: "`$got`" },
					{ name: "Random anime quote", value: "`$anime`" },
					{ name: "Anime quote", value: "`$anime death note`" }
				);
			message.channel.send(embed);
		}
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
			current[message.channel.id]
				? handleWrong(current[message.channel.id], message, false)
				: noPrevError(message);
		// handling the list command
		else if (command === "list")
			current[message.channel.id]
				? handleWrong(current[message.channel.id], message, true)
				: noPrevError(message);
		// handling the options
		// giving choice without a current set of result
		else if (!current[message.channel.id] && parseInt(command))
			noPrevError(message);
		// invalid options
		else if (
			(current[message.channel.id] &&
				parseInt(command) > current[message.channel.id].length) ||
			parseInt(command) === 0
		)
			message.reply(
				`Are you messing with me?!\nIf not, choose an option __between 1 and ${
					current[message.channel.id].length
				}__.`
			);
		// valid options
		else if (current[message.channel.id] && parseInt(command) > 0)
			returnCorrect(parseInt(command), current[message.channel.id], message);
		// invalid command
		else dontKnow(command, message);
	} else return;
};

/**
 * function to search the movies, tv shows and animes from tmdb
 * @param {String} media
 * @param {String} name
 * @param {} message
 */
async function search(media, name, message) {
	try {
		const res = await myAxios.get(
			`/search/${media}?api_key=${process.env.TMDB_KEY}&query=${name
				.split(" ")
				.join("+")}`
		);

		let collection = [...res.data.results];
		// checking for multiple pages of results
		if (res.data.results.length > 19) {
			const page2 = await myAxios.get(
				`/search/${media}?api_key=${process.env.TMDB_KEY}&query=${name
					.split(" ")
					.join("+")}&page=2`
			);

			collection = [...res.data.results, ...page2.data.results];
		}

		// sorting in descending order of popularity
		const sortedResults = collection.sort((a, b) =>
			a.popularity > b.popularity ? -1 : 1
		);
		// extracting the first element of the array (mostly correct)
		const mainResult = sortedResults[0];
		// storing the results in a global variable for further use
		current[message.channel.id] = sortedResults;

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
		console.log(error.message);
	}
}

/**
 * handling the wrong results by showing a number of other results
 * @param {Object[]} movies
 * @param {*} message
 * @param {Boolean} isCorrect
 * @returns
 */
function handleWrong(movies, message, isCorrect) {
	// user has given wrong when there was only a single result received.
	if (movies.length === 1) {
		message.reply("Sorry dude, That was the only result I got.");
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
	// sending the message
	message.reply(text);
}

/**
 * function to send a movie detail as messsage
 * @param {Object} movie
 * @param {*} message
 */
function sendMovie(movie, message) {
	// image url, (IMG_LINK) is the common part for all links
	const imageUrl = `${process.env.IMG_LINK}${movie.poster_path}`;
	// isTV is false for movies
	const isTV = movie.first_air_date ? true : false;
	// isAnime is true only for animes
	const isAnime = isTV && movie.original_language === "ja";
	const embed = new MessageEmbed()
		.setColor(`${isAnime ? "#ff0054" : isTV ? "#ff5400" : "#2d00f7"}`)
		.setTitle(
			`${isAnime ? "Anime" : isTV ? "TV show" : "Movie"} : **${
				movie.name || movie.title
			}**`
		)
		.setDescription(movie.overview)
		.setImage(imageUrl)
		.addField(
			`${isTV ? "First Air Date" : "Released On"}`,
			`**${movie.first_air_date || movie.release_date}**`,
			false
		)
		.setFooter(`Source Rating : ${movie.vote_average}`);
	// sending the embedded message
	message.channel.send(embed);
}

/**
 * telling the user that there is no cached data
 * @param {*} message
 */
function noPrevError(message) {
	message.reply("Search for a movie or tv show first, then go for the choice!");
}

/**
 * calling the sendMovie function with the correct choice
 * @param {Number} choice
 * @param {Object[]} movies
 * @param {*} message
 */
function returnCorrect(choice, movies, message) {
	sendMovie(movies[choice - 1], message);
}

/**
 * sending a random Breaking Bad quote
 * @param {*} message
 */
async function breakingBadQuote(message) {
	try {
		const returnedValue = await axios.get(api_urls.brba);
		const result = returnedValue.data[0];
		message.channel.send(`"${result.quote}" - **${result.author}**.`);
	} catch (error) {
		console.log(error.message);
		message.channel.send("There was an error with the api :confused:");
	}
}

/**
 * send a random Game of thrones quote
 * @param {*} message
 */
async function gotQuote(message) {
	try {
		const returnedValue = await axios.get(api_urls.got);
		const data = returnedValue.data;
		message.channel.send(`"${data.sentence}" - **${data.character.name}**.`);
	} catch (error) {
		console.log(error.message);
		message.channel.send("There was an error with the api :confused:");
	}
}

/**
 * send a random anime quote
 * @param {*} message
 */
async function randomAnimeQuote(message) {
	try {
		const request = `${api_urls.anime}/random`;
		const returnedValue = await axios.get(request);
		const data = returnedValue.data;
		console.log(data);
		message.channel.send(
			`"${data.quote}" - **${data.character}**.\n\nFrom *${data.anime}*.`
		);
	} catch (error) {
		console.log(error.message);
		message.channel.send("There was an error with the api :confused:");
	}
}

/**
 * send a quote from the specified anime
 * @param {*} message
 * @param {String} query
 */
async function animeQuote(message, query) {
	const randomPage = parseInt(Math.random() * 9) + 1;
	try {
		const request = `${api_urls.anime}/quotes/anime?title=${query}&page=${randomPage}`;
		const returnedValue = await axios.get(request);
		// extract the data if and only there is something available
		const data = returnedValue.data && returnedValue.data[0];
		console.log(data);
		if (data) message.channel.send(`"${data.quote}" - **${data.character}**.`);
		else
			message.channel.send(
				`The api isn't super intelligent:confused:. Try giving the exact name of the anime. Are you sure that it is only '${query}'? `
			);
	} catch (error) {
		console.log(error.message);
		// TypeError means that there was a special char given into the request url
		if (error instanceof TypeError)
			message.channel.send(
				"One of the characters cannot be parsed :confused:. I hope you can find a work around :)"
			);
		// unknown rare error has occured
		else
			message.channel.send(
				`There was an error with the api :confused:. ${error.message} `
			);
	}
}

/**
 * handling the !anime command
 * @param {*} message
 * @param {String} command
 */
function handleAnime(message, command) {
	const query = command.split(" ").slice(1).join(" ");
	// if there is a query, call animeQuote, or else....random quote
	if (!query) randomAnimeQuote(message);
	else if (query) animeQuote(message, query);
}

/**
 * unknown command handling
 * @param {String} command
 * @param {*} message
 */
function dontKnow(command, message) {
	// cutting out the query (if any)
	let com = command.split(" ")[0];
	// default reply
	const statement = `I don't know how to handle the __**${com}**__ command! 😒😒`;
	// striping the command's first two letters
	const strip = command.slice(0, 2);
	// finding a similar command with first two letters
	let nearest = commandList.find((word) => word.startsWith(strip));
	// finding a similar command with only the first letter
	if (!nearest)
		nearest = commandList.find((word) => word.startsWith(strip.slice(0, 1)));
	// suggestion statement
	const suggestion = nearest ? `\nMaybe you meant **${nearest}** ?` : "";
	message.channel.send(statement + suggestion);
}

// main messageEvent listener
client.on("message", interact);
