const { generateAuthenticationOptions } = require("@simplewebauthn/server");
const { getUserByUsername, createUser } = require("./wds/db.js");

const CLIENT_URL = "https://db-2-cards.vercel.app/api/init-auth"; //| http://localhost:5500";| not127.0.0.1
const CLIENT_Netlify_URL = "https://elegant-bubblegum-a62895.netlify.app/.netlify/functions/init-auth";
const RP_ID = "[https://db-2-cards.vercel.app](https://db-2-cards.vercel.app)"; //rp_id like cors
const Net_RP_ID = "[https://elegant-bubblegum-a62895.netlify.app](https://elegant-bubblegum-a62895.netlify.app)"; //rp_id like cors

// test0 pw empty, test1
createUser("testuser0", "test0@example.com", {
	id: "some-id",
	transports: ["some-transport"],
});
createUser("testuser1", "test1@example.com", {});
createUser("testuser2", "test2@example.com", {});

module.exports = async (req, res) => {
	const username = req.query.username;
	console.log("Received auth request for username:", username);
	if (!username) {
		res.setHeader("Access-Control-Allow-Origin", CLIENT_URL);
		res.setHeader("Access-Control-Allow-Credentials", "true");
		res.setHeader("Content-Type", "application/json");

		return res.status(400).json({ error: "Username is required" });
	}

	const user = getUserByUsername(username);
	console.log("User found:", user);
	if (!user) {
		res.setHeader("Access-Control-Allow-Origin", CLIENT_URL);
		res.setHeader("Access-Control-Allow-Credentials", "true");
		res.setHeader("Content-Type", "application/json");

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

	res.setHeader(
		"Access-Control-Allow-Origin",
		CLIENT_URL,
		"Access-Control-Allow-Credentials",
		"true",
		"Content-Type",
		"application/json",
		"Set-Cookie",
		`authInfo=${encodeURIComponent(
			JSON.stringify({
				userId: user.id,
				challenge: options.challenge,
			}),
		)}; HttpOnly; Path=/; Max-Age=60; Secure`,
	);
	return res.status(200).json(options);
};

exports.handler = async (event) => {
	const username = event.queryStringParameters.username;
	console.log("Received auth request for username:", username);
	if (!username) {
		return {
			statusCode: 400,
			headers: {
				"Access-Control-Allow-Origin": CLIENT_Netlify_URL,
				"Access-Control-Allow-Credentials": "true",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ error: "Username is required" }),
		};
	}

	const user = getUserByUsername(username);

	if (!user) {
		return {
			statusCode: 400,
			headers: {
				"Access-Control-Allow-Origin": CLIENT_Netlify_URL,
				"Access-Control-Allow-Credentials": "true",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ error: "No user for this username" }),
		};
	}

	const options = await generateAuthenticationOptions({
		rpID: Net_RP_ID,
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
			"Access-Control-Allow-Origin": CLIENT_Netlify_URL,
			"Access-Control-Allow-Credentials": "true",
			"Content-Type": "application/json",
			"Set-Cookie": `authInfo=${encodeURIComponent(JSON.stringify({ userId: user.id, challenge: options.challenge }))}; HttpOnly; Path=/; Max-Age=60; Secure`,
		},
		body: JSON.stringify(options),
	};
};
