const fetch = require("node-fetch");

module.exports = async function getData(type) {
	if (type === "joke") {
		const response = await fetch("https://www.yomama-jokes.com/api/v1/jokes/random/");
		return await response.json();
	} else if (type === "insult") {
		const response = await fetch("https://evilinsult.com/generate_insult.php?lang=en&type=json");
		return await response.json();
	} else if (type === "image") {
		const response = await fetch("https://picsum.photos/200/300");
		const arrayBuffer = await response.arrayBuffer();
		return {
			buffer: Buffer.from(arrayBuffer),
			contentType: response.headers.get("content-type") || "image/jpeg",
		};
	} else {
		throw new Error("Unknown type");
	}
};
