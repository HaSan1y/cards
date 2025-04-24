const fetch = require("node-fetch");

// Common logic
async function getJoke() {
	const response = await fetch("https://icanhazdadjoke.com/", {
		headers: { Accept: "text/plain", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Credentials": "true", "Content-Type": "application/json" },
	});
	return await response.text();
}

// Vercel handler
module.exports = async (req, res) => {
	const { headers } = req;
	const origin = headers.origin || headers.Origin || "*";
	res.setHeader("Access-Control-Allow-Origin", origin);
	res.setHeader("Access-Control-Allow-Credentials", "true");
	res.setHeader("Content-Type", "text/plain");
	const joke = await getJoke();
	res.status(200).setHeader("Content-Type", "text/plain").send(joke);
};

// Netlify handler
exports.handler = async (event) => {
	const joke = await getJoke();
	return {
		statusCode: 200,
		headers: {
			"Content-Type": "text/plain",
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Credentials": "true",
		},
		body: joke,
	};
};
