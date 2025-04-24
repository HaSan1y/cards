const { generateRegistrationOptions } = require("@simplewebauthn/server");
const { getUserByEmail, createUser } = require("./wds/db.js");

const CLIENT_URL = "https://db-2-cards.vercel.app/api/init-register"; //| http://localhost:5500";| not127.0.0.1
const RP_ID = "https://db-2-cards.vercel.app";
const RP_NAME = "h451";

createUser("testuser1", "test1@example.com", {});
createUser("testuser2", "test2@example.com", {});

//////////////////////////////////////////////////////////////////////////////////////////////verce
module.exports = async (req, res) => {
	console.log("Request received:", req.method, req.url);
	console.log("Request headers:", req.headers);
	if (req.CLIENT_URL !== CLIENT_URL) {
		return res.status(403).json({ error: "Invalid request origin", origin: req.CLIENT_URL, expected: CLIENT_URL });
	}

	const email = req.query.email;
	if (!email) {
		return res.status(400).json({ error: "Email is required" });
	}

	if (getUserByEmail(email) != null) {
		return res.status(400).json({ error: "User already exists" });
	}

	const options = await generateRegistrationOptions({
		rpID: RP_ID,
		rpName: RP_NAME,
		userName: email,
	});
	// res.cookie(
	res.setHeader(
		"Access-Control-Allow-Origin",
		CLIENT_URL,
		"Access-Control-Allow-Credentials",
		"true",
		"Content-Type",
		"application/json",
		"Set-Cookie",
		`regInfo=${encodeURIComponent(
			JSON.stringify({
				userId: options.user.id,
				email,
				challenge: options.challenge,
			}),
		)}; HttpOnly; Path=/; Max-Age=60; Secure`,
	);

	res.json(options);
};

//////////////////////////////////////////////////////////////////////////////////////////////net
exports.handler = async (event) => {
	// const params = new URLSearchParams(event.queryStringParameters);
	// const email = params.get("email");
	const email = event.queryStringParameters.email;
	if (!email) return { statusCode: 400, body: JSON.stringify({ error: "Email is required" }) };
	if (getUserByEmail(email)) return { statusCode: 400, body: JSON.stringify({ error: "User already exists" }) };

	const options = await generateRegistrationOptions({
		rpID: RP_ID,
		rpName: RP_NAME,
		userName: email,
	});

	return {
		statusCode: 200,
		headers: {
			"Access-Control-Allow-Origin": CLIENT_URL,
			"Access-Control-Allow-Credentials": "true",
			"Content-Type": "application/json",
			"Set-Cookie": `regInfo=${encodeURIComponent(
				JSON.stringify({
					userId: options.user.id,
					email,
					challenge: options.challenge,
				}),
			)}; HttpOnly; Path=/; Max-Age=60; Secure`,
		},
		body: JSON.stringify(options),
	};
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
