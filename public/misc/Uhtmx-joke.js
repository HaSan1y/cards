// Common logic - remains the same
async function getJoke() {
	const response = await fetch("https://icanhazdadjoke.com/", {
		headers: { Accept: "text/plain" },
	});
	if (!response.ok) {
		const errorText = await response.text(); // Try to get error details
		console.error(`Failed to fetch joke: Status ${response.status}, Body: ${errorText}`);
		throw new Error(`Failed to fetch joke: Status ${response.status}`);
	}
	return await response.text();
}

// Unified handler for Vercel and Netlify
module.exports = async (arg1, arg2) => {
	// Detect the environment
	const isVercel = !!process.env.VERCEL; // Vercel sets VERCEL=1
	// const isNetlify = !!process.env.NETLIFY; // Netlify sets NETLIFY=true (optional check)

	let origin = "*"; // Default CORS origin
	let headersSource;

	// Assign arguments based on platform
	if (isVercel) {
		// Vercel: args are (req, res)
		const req = arg1;
		headersSource = req.headers;
	} else {
		// Netlify: args are (event, context)
		const event = arg1;
		headersSource = event.headers;
	}

	// Extract origin header (case-insensitive) - common logic
	if (headersSource) {
		origin = headersSource.origin || headersSource.Origin || "*";
	}

	try {
		const joke = await getJoke();

		// --- Platform-specific response ---
		if (isVercel) {
			const res = arg2; // Get the response object for Vercel
			res.setHeader("Access-Control-Allow-Origin", origin);
			res.setHeader("Content-Type", "text/plain");
			res.status(200).send(joke);
		} else {
			// Netlify: Return the response object
			return {
				statusCode: 200,
				headers: {
					"Content-Type": "text/plain",
					"Access-Control-Allow-Origin": origin,
				},
				body: joke,
			};
		}
	} catch (error) {
		console.error("Error in handler:", error); // Log the specific error

		// --- Platform-specific error response ---
		if (isVercel) {
			const res = arg2;
			res.setHeader("Access-Control-Allow-Origin", origin);
			res.setHeader("Content-Type", "text/plain");
			// Send a more informative error message if possible, but keep it simple for client
			res.status(500).send(`Error fetching joke: ${error.message}`);
		} else {
			// Netlify
			return {
				statusCode: 500,
				headers: {
					"Content-Type": "text/plain",
					"Access-Control-Allow-Origin": origin,
				},
				// Send a more informative error message if possible
				body: `Error fetching joke: ${error.message}`,
			};
		}
	}
};
