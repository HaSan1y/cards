const { verifyAuthenticationResponse } = require("@simplewebauthn/server");
const { createUser, updateUserCounter, getUserById } = require("./wds/db.js");

const CLIENT_URL = "https://db-2-cards.vercel.app/api/verify-auth"; //| http://localhost:5500";| not127.0.0.1
const CLIENT_Netlify_URL = "https://elegant-bubblegum-a62895.netlify.app/.netlify/functions/verify-auth";
const RP_ID = "[https://db-2-cards.vercel.app](https://db-2-cards.vercel.app)"; //rp_id like cors
const Net_RP_ID = "[https://elegant-bubblegum-a62895.netlify.app](https://elegant-bubblegum-a62895.netlify.app)"; //rp_id like cors
// test0 pw empty, test1
createUser("testuser0", "test0@example.com", {
	id: "some-id",
	transports: ["some-transport"],
});
createUser("testuser1", "test1@example.com", {});
createUser("testuser2", "test2@example.com", {});
function parseCookies(cookieHeader) {
	const cookies = {};
	if (!cookieHeader) return cookies;
	cookieHeader.split(";").forEach((cookie) => {
		const [name, ...rest] = cookie.trim().split("=");
		cookies[name] = decodeURIComponent(rest.join("="));
	});
	return cookies;
}
module.exports = async (req, res) => {
	const authInfo = req.cookies && req.cookies.authInfo ? JSON.parse(req.cookies.authInfo) : null;

	if (!authInfo) {
		res.setHeader("Access-Control-Allow-Origin", CLIENT_URL);
		res.setHeader("Access-Control-Allow-Credentials", "true");
		res.setHeader("Content-Type", "application/json");
		return res.status(400).json({ error: "Authentication info not found" });
	}

	const user = getUserById(authInfo.userId);
	if (user == null || user.passKey.id != req.body.id) {
		res.setHeader("Access-Control-Allow-Origin", CLIENT_URL);
		res.setHeader("Access-Control-Allow-Credentials", "true");
		res.setHeader("Content-Type", "application/json");
		return res.status(400).json({ error: "Invalid user" });
	}

	const verification = await verifyAuthenticationResponse({
		response: req.body,
		expectedChallenge: authInfo.challenge,
		expectedOrigin: CLIENT_URL,
		expectedRPID: RP_ID,
		authenticator: {
			credentialID: user.passKey.id,
			credentialPublicKey: user.passKey.publicKey,
			counter: user.passKey.counter,
			transports: user.passKey.transports,
		},
	});

	if (verification.verified) {
		updateUserCounter(user.id, verification.authenticationInfo.newCounter);
		res.clearCookie("authInfo");
		// Save user in a session cookie
		res.setHeader("Access-Control-Allow-Origin", CLIENT_URL);
		res.setHeader("Access-Control-Allow-Credentials", "true");
		res.setHeader("Content-Type", "application/json");
		return res.json({ verified: verification.verified });
	} else {
		res.setHeader("Access-Control-Allow-Origin", CLIENT_URL);
		res.setHeader("Access-Control-Allow-Credentials", "true");
		res.setHeader("Content-Type", "application/json");
		return res.status(400).json({ verified: false, error: "Verification failed" });
	}
};

exports.handler = async (event) => {
	const cookies = parseCookies(event.headers.cookie);
	const authInfo = cookies.authInfo ? JSON.parse(cookies.authInfo) : null;

	if (!authInfo) {
		return {
			statusCode: 400,
			body: JSON.stringify({ error: "Authentication info not found" }),
		};
	}
	const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;

	const user = getUserById(authInfo.userId);
	if (user == null || user.passKey.id != event.body.id) {
		return {
			statusCode: 400,
			headers: {
				"Access-Control-Allow-Origin": CLIENT_Netlify_URL,
				"Access-Control-Allow-Credentials": "true",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ error: "Invalid user" }),
		};
	}

	const verification = await verifyAuthenticationResponse({
		response: body,
		expectedChallenge: authInfo.challenge,
		expectedOrigin: CLIENT_Netlify_URL,
		expectedRPID: Net_RP_ID,
		authenticator: {
			credentialID: user.passKey.id,
			credentialPublicKey: user.passKey.publicKey,
			counter: user.passKey.counter,
			transports: user.passKey.transports,
		},
	});

	if (verification.verified) {
		updateUserCounter(user.id, verification.authenticationInfo.newCounter);
		event.context.clearCookie("authInfo");
		// Save user in a session cookie
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": CLIENT_Netlify_URL,
				"Access-Control-Allow-Credentials": "true",
				"Content-Type": "application/json",
				"Set-Cookie": "authInfo=; HttpOnly; Path=/; Max-Age=0; Secure; SameSite=None",
			},
			body: JSON.stringify({ verified: verification.verified }),
		};
	} else {
		return {
			statusCode: 400,
			headers: {
				"Access-Control-Allow-Origin": CLIENT_Netlify_URL,
				"Access-Control-Allow-Credentials": "true",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ verified: false, error: "Verification failed" }),
		};
	}
};
