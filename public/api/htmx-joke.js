const fetch = require("node-fetch");

// Common logic
async function getJoke() {
	const response = await fetch("https://icanhazdadjoke.com/", {
		headers: { Accept: "text/plain" },
	});
	return await response.text();
}

// Netlify handler
exports.handler = async (event) => {
	const joke = await getJoke();
	return {
		statusCode: 200,
		headers: { "Content-Type": "text/plain" },
		body: joke,
	};
};

// Vercel handler
module.exports = async (req, res) => {
	const response = await fetch("https://icanhazdadjoke.com/", {
		headers: { Accept: "text/plain" },
	});
	const joke = await response.text();
	res.status(200).setHeader("Content-Type", "text/plain").send(joke);
};
