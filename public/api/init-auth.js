const { generateAuthenticationOptions } = require("@simplewebauthn/server");
const { getUserByUsername, createUser } = require("./wds/db.js");

const CLIENT_URL = "https://db-2-cards.vercel.app"; //| http://localhost:5500";| not127.0.0.1
const RP_ID = "https://db-2-cards.vercel.app/api/login";

createUser("testuser1", "test1@example.com", {});
createUser("testuser2", "test2@example.com", {});

module.exports = async (req, res) => {
	const username = req.query.username;
	console.log("Received auth request for username:", username);
	if (!username) {
		return res.status(400).json({ error: "Username is required" });
	}

	const user = getUserByUsername(username);
	console.log("User found:", user);
	if (!user) {
		return res.status(400).json({ error: "No user for this username" });
	}

	const options = await generateAuthenticationOptions({
		rpID: RP_ID,
		allowCredentials: [
			{
				id: user.passKey.id,
				type: "public-key",
				transports: user.passKey.transports,
			},
		],
	});

	// res.cookie(
	// 	"authInfo",
	// 	JSON.stringify({
	// 		userId: user.id,
	// 		challenge: options.challenge,
	// 	}),
	// 	{ httpOnly: true, maxAge: 60000, secure: true },
	// );
	res.setHeader(
		"Access-Control-Allow-Origin",
		CLIENT_URL,
		"Access-Control-Allow-Credentials",
		"true",
		"Content-Type",
		"application/json",
		// "Set-Cookie",
		"Set-Cookie",
		`authInfo=${encodeURIComponent(
			JSON.stringify({
				userId: user.id,
				challenge: options.challenge,
			}),
		)}; HttpOnly; Path=/; Max-Age=60; Secure`,
	);
	res.json(options);
};

exports.handler = async (event) => {
	const username = event.queryStringParameters.username;
	console.log("Received auth request for username:", username);
	if (!username) {
		return {
			statusCode: 400,
			body: JSON.stringify({ error: "Username is required" }),
		};
	}

	const user = getUserByUsername(username);

	if (!user) {
		return {
			statusCode: 400,
			body: JSON.stringify({ error: "No user for this username" }),
		};
	}

	const options = await generateAuthenticationOptions({
		rpID: RP_ID,
		allowCredentials: [
			{
				id: user.passKey.id,
				type: "public-key",
				transports: user.passKey.transports,
			},
		],
	});

	return {
		statusCode: 200,
		headers: {
			"Access-Control-Allow-Origin": CLIENT_URL,
			"Access-Control-Allow-Credentials": "true",
			"Content-Type": "application/json",
			"Set-Cookie": `authInfo=${encodeURIComponent(JSON.stringify({ userId: user.id, challenge: options.challenge }))}; HttpOnly; Path=/; Max-Age=60; Secure`,
		},
		body: JSON.stringify(options),
	};
};
