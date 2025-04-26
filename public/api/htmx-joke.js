// Common logic
async function getJoke() {
	const response = await fetch("https://icanhazdadjoke.com/", {
		headers: { Accept: "text/plain" },
	});
	if (!response.ok) {
		console.error(`Failed to fetch joke: Status ${response.status}`);
		throw new Error(`Failed to fetch joke: Status ${response.status}`);
	}
	return await response.text();
}

// Vercel handler
module.exports = async (req, res) => {
	const { headers } = req;
	const origin = headers.origin || headers.Origin || "*"; // Default to "*"
	try {
		const joke = await getJoke();
		res.setHeader("Access-Control-Allow-Origin", origin);
		//res.setHeader("Access-Control-Allow-Credentials", "true");
		res.setHeader("Content-Type", "text/plain");
		res.status(200).send(joke);
	} catch (error) {
		console.error("Error fetching joke:", error);
		res.setHeader("Access-Control-Allow-Origin", origin);
		//res.setHeader("Access-Control-Allow-Credentials", "true");// Avoid credentials:true with wildcard origin
		res.setHeader("Content-Type", "text/plain");
		res.status(500).send("Error fetching joke");
	}
};
