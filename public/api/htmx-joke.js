const fetch = require("node-fetch");

// Common logic
async function getJoke() {
	const response = await fetch("https://icanhazdadjoke.com/", {
		headers: { Accept: "text/plain" },
	});
	if (!response.ok) throw new Error("Failed to fetch joke");
	return await response.text();
}

// Vercel handler
module.exports = async (req, res) => {
	const { headers } = req;
	const origin = headers.origin || headers.Origin || "*";
	try {
		const joke = await getJoke();
		res.setHeader("Access-Control-Allow-Origin", origin);
		res.setHeader("Access-Control-Allow-Credentials", "true");
		res.setHeader("Content-Type", "text/plain");
		res.status(200).send(joke);
	} catch (error) {
		console.error("Error fetching joke:", error);
		res.setHeader("Access-Control-Allow-Origin", origin);
		res.setHeader("Access-Control-Allow-Credentials", "true");
		res.setHeader("Content-Type", "text/plain");
		res.status(500).send("Error fetching joke");
	}
};

// Netlify handler
exports.handler = async (event) => {
	try {
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
	} catch (error) {
		console.error("Error fetching joke:", error);
		return {
			statusCode: 500,
			headers: {
				"Content-Type": "text/plain",
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Credentials": "true",
			},
			body: "Error fetching joke",
		};
	}
};
