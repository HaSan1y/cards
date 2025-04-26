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
// Netlify handler
// export async function handler(event) {
exports.handler = async (event) => {
	const { headers } = event;
	const origin = headers.origin || headers.Origin || "*"; // Default to "*"
	try {
		const joke = await getJoke();
		return {
			statusCode: 200,
			headers: {
				"Content-Type": "text/plain",
				"Access-Control-Allow-Origin": origin,
				//"Access-Control-Allow-Credentials": "true",
			},
			body: joke,
		};
	} catch (error) {
		console.error("Error fetching joke:", error);
		return {
			statusCode: 500,
			headers: {
				"Content-Type": "text/plain",
				"Access-Control-Allow-Origin": origin,
				//"Access-Control-Allow-Credentials": "true",
			},
			body: `Error fetching joke: ${error.message}`,
		};
	}
};
