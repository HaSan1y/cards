const { verifyRegistrationResponse } = require("@simplewebauthn/server");
const { createUser } = require("./wds/db.js");

const CLIENT_URL = "https://db-2-cards.vercel.app/api/verify-register"; //| http://localhost:5500";| not127.0.0.1
const CLIENT_Netlify_URL = "https://elegant-bubblegum-a62895.netlify.app/.netlify/functions/verify-register";
const RP_ID = "https://db-2-cards.vercel.app";

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
	const regInfo = req.cookies && req.cookies.regInfo ? JSON.parse(req.cookies.regInfo) : null;

	if (!regInfo) {
		res.setHeader("Access-Control-Allow-Origin", CLIENT_URL);
		res.setHeader("Access-Control-Allow-Credentials", "true");
		res.setHeader("Content-Type", "application/json");
		return res.status(400).json({ error: "Registration info not found" });
	}

	const verification = await verifyRegistrationResponse({
		response: req.body,
		expectedChallenge: regInfo.challenge,
		expectedOrigin: CLIENT_URL,
		expectedRPID: RP_ID,
	});

	if (verification.verified) {
		createUser(regInfo.userId, regInfo.email, {
			id: verification.registrationInfo.credentialID,
			publicKey: verification.registrationInfo.credentialPublicKey,
			counter: verification.registrationInfo.counter,
			deviceType: verification.registrationInfo.credentialDeviceType,
			backedUp: verification.registrationInfo.credentialBackedUp,
			transport: req.body.transports,
		});
		res.clearCookie("regInfo");
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
	const regInfo = cookies.regInfo ? JSON.parse(cookies.regInfo) : null;

	if (!regInfo) {
		return {
			statusCode: 400,
			headers: {
				"Access-Control-Allow-Origin": CLIENT_Netlify_URL,
				"Access-Control-Allow-Credentials": "true",
				"Content-Type": "application/json",
				"Access-Control-Allow-Headers": "Content-Type",
			},
			body: JSON.stringify({ error: "Registration info not found" }),
		};
	}
	const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;

	const verification = await verifyRegistrationResponse({
		response: body,
		expectedChallenge: regInfo.challenge,
		expectedOrigin: CLIENT_Netlify_URL,
		expectedRPID: RP_ID,
	});

	if (verification.verified) {
		createUser(regInfo.userId, regInfo.email, {
			id: verification.registrationInfo.credentialID,
			publicKey: verification.registrationInfo.credentialPublicKey,
			counter: verification.registrationInfo.counter,
			deviceType: verification.registrationInfo.credentialDeviceType,
			backedUp: verification.registrationInfo.credentialBackedUp,
			transport: body.transports,
		});

		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": CLIENT_Netlify_URL,
				"Access-Control-Allow-Credentials": "true",
				"Content-Type": "application/json",
				"Set-Cookie": `regInfo=; HttpOnly; Path=/; Max-Age=0; Secure`,
				"Access-Control-Allow-Headers": "Content-Type",
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
				"Access-Control-Allow-Headers": "Content-Type",
			},
			body: JSON.stringify({ verified: false, error: "Verification failed" }),
		};
	}
};
