const fetch = require("node-fetch");

module.exports = async function getData(type) {
	//console.log(`Incoming ${type} request`);
	try {
		if (type === "joke") {
			const response = await fetch("https://www.yomama-jokes.com/api/v1/jokes/random/");
			return await response.json();
		} else if (type === "insult") {
			const response = await fetch("https://evilinsult.com/generate_insult.php?lang=en&type=json");
			return await response.json();
		} else if (type === "image") {
			const response = await fetch(`https://picsum.photos/200/300?random=${Date.now()}`);
			const arrayBuffer = await response.arrayBuffer();
			return {
				buffer: Buffer.from(arrayBuffer),
				contentType: response.headers.get("content-type") || "image/jpeg",
			};
		} else {
			throw new Error("Unknown type");
		}
	} catch (error) {
		console.error("Error fetching data:", error);
		throw error;
	}
};
