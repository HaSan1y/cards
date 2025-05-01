const { verifyRegistrationResponse } = require("@simplewebauthn/server");
// const { createUser } = require("./db/wds-basicDB.js");
const { createUser, getUserByUsername, getUserByEmail } = require("./db/vercelDB.js");
const bcrypt = require("bcrypt");
const { Buffer } = require("buffer");
const saltRounds = 10;
const ALLOWED_ORIGINS = [
	"http://localhost:3000", // Local development
	"https://db-2-cards.vercel.app", // Vercel deployment
	"https://elegant-bubblegum-a62895.netlify.app", // Netlify deployment (if used)
	"http://localhost:8888",
];

// Relying Party configuration based on the origin
const RP_CONFIG = {
	"http://localhost:3000": {
		rpId: "localhost", // RP ID for local development MUST be 'localhost'
		rpName: "Local Dev h451",
	},
	"https://db-2-cards.vercel.app": {
		rpId: "db-2-cards.vercel.app", // RP ID for Vercel MUST match the domain
		rpName: "Vercel h451",
	},
	"https://elegant-bubblegum-a62895.netlify.app": {
		rpId: "elegant-bubblegum-a62895.netlify.app", // RP ID for Netlify MUST match the domain
		rpName: "Netlify h451",
	},
	"http://localhost:8888": {
		rpId: "localhost",
		rpName: "Local Netlify Dev h451",
	},
};

// function parseCookies(cookieHeader) {
// 	const cookies = {};
// 	if (!cookieHeader) return cookies;
// 	cookieHeader.split(";").forEach((cookie) => {
// 		const [name, ...rest] = cookie.trim().split("=");
// 		cookies[name] = decodeURIComponent(rest.join("="));
// 	});
// 	return cookies;
// }
exports.handler = async (event) => {
	const origin = event.headers.origin;
	const host = event.headers.host; // e.g., 'localhost:3000'
	console.log(`[Vercel Init-Register] Received Request: Method=${event.httpMethod}, Origin='${origin}', Host='${host}'`);
	let isAllowed = false;
	let effectiveOrigin = origin; // Will store the origin to use in response headers

	const vercelHost = "db-2-cards.vercel.app";
	const vercelOrigin = "https://db-2-cards.vercel.app";
	const netlifyHost = "elegant-bubblegum-a62895.netlify.app"; // Make sure this is the correct host header value for Netlify
	const netlifyOrigin = "https://elegant-bubblegum-a62895.netlify.app";
	const localhost3000Host = "localhost:3000";
	const localhost3000Origin = "http://localhost:3000";
	const localhost8888Host = "localhost:8888"; // Common for `netlify dev`
	const localhost8888Origin = "http://localhost:8888";
	const CURRENT_ALLOWED_ORIGINS = [localhost3000Origin, localhost8888Origin, vercelOrigin, netlifyOrigin];
	if (origin && CURRENT_ALLOWED_ORIGINS.includes(origin)) {
		isAllowed = true;
		effectiveOrigin = origin;
	} else if (!origin) {
		if (host === localhost3000Host) {
			isAllowed = true;
			effectiveOrigin = localhost3000Origin;
			console.warn("Allowing same-origin request from host 'localhost:3000' (Origin header undefined).");
		} else if (host === localhost8888Host) {
			isAllowed = true;
			effectiveOrigin = localhost8888Origin;
			console.warn("Allowing same-origin request from host 'localhost:8888' (Origin header undefined).");
		} else if (host === vercelHost) {
			isAllowed = true;
			effectiveOrigin = vercelOrigin;
			console.warn(`Allowing same-origin request from host '${vercelHost}' (Origin header undefined).`);
		} else if (host === netlifyHost) {
			isAllowed = true;
			effectiveOrigin = netlifyOrigin;
			console.warn(`Allowing same-origin request from host '${netlifyHost}' (Origin header undefined).`);
		}
	}
	const httpMethod = event.httpMethod;
	if (httpMethod === "OPTIONS") {
		if (isAllowed && RP_CONFIG[effectiveOrigin]) {
			// const isValidEffectiveOrigin = RP_CONFIG[effectiveOrigin] && ALLOWED_ORIGINS.includes(effectiveOrigin);
			// if (isValidEffectiveOrigin) {
			return {
				statusCode: 204,
				headers: {
					"Access-Control-Allow-Origin": effectiveOrigin,
					"Access-Control-Allow-Credentials": "true",
					"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type",
				},
				body: "",
			};
		} else {
			console.error(`OPTIONS request blocked: Determined origin '${effectiveOrigin}' not configured/allowed. Original Origin='${origin}', Host='${host}'`);
		}
	}
	const commonHeaders = {
		"Access-Control-Allow-Origin": effectiveOrigin,
		"Access-Control-Allow-Credentials": "true",
		"Content-Type": "application/json",
	};
	if (!isAllowed) {
		console.error(`Request blocked: Origin='${origin}', Host='${host}'.`);

		return { statusCode: 403, headers: commonHeaders, body: JSON.stringify({ error: "Invalid request origin/host" }) };
	}

	// 3. Get RP Config for this origin
	const currentRpConfig = RP_CONFIG[effectiveOrigin];
	if (!currentRpConfig) {
		console.error(`No RP config found for allowed origin: ${effectiveOrigin}`);
		return { statusCode: 500, headers: commonHeaders, body: JSON.stringify({ error: "Server configuration error for origin" }) };
	}
	// const cookies = parseCookies(event.headers.cookie);
	// const regInfo = cookies.regInfo ? JSON.parse(cookies.regInfo) : null;

	// if (!regInfo) {
	// 	return {
	// 		statusCode: 400,
	// 		headers: commonHeaders,
	// 		body: JSON.stringify({ error: "Registration info not found" }),
	// 	};
	// }
	// const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
	let body;
	try {
		body = JSON.parse(event.body);
	} catch (e) {
		console.error("Failed to parse request body:", event.body);
		return { statusCode: 400, headers: commonHeaders, body: JSON.stringify({ error: "Invalid request body." }) };
	}
	const { username, email, password, expectedChallenge, userId, ...webAuthnResponse } = body;
	if (!username || !email || !password || !expectedChallenge || !userId || !webAuthnResponse?.id) {
		console.error("Missing required fields in request body for /Nverify-register", {
			username,
			email,
			password_present: !!password,
			expectedChallenge,
			userId,
			webAuthnResponse_id: webAuthnResponse?.id,
		});
		return { statusCode: 400, headers: commonHeaders, body: JSON.stringify({ error: "Missing required registration fields or WebAuthn data." }) };
	}

	// Check for existing users
	const existingUserByUsername = await getUserByUsername(username);
	if (existingUserByUsername) {
		return { statusCode: 400, headers: commonHeaders, body: JSON.stringify({ error: "Username already taken" }) };
	}
	const existingUserByEmail = await getUserByEmail(email);
	if (existingUserByEmail) {
		return { statusCode: 400, headers: commonHeaders, body: JSON.stringify({ error: "Email already taken" }) };
	}

	// Hash password
	let passwordHash;
	try {
		passwordHash = await bcrypt.hash(password, saltRounds);
	} catch (hashError) {
		console.error("Error hashing password:", hashError);
		return { statusCode: 500, headers: commonHeaders, body: JSON.stringify({ error: "Failed to process password." }) };
	}

	try {
		console.log(`Verifying registration for user ${username} (ID: ${userId}) with challenge: ${expectedChallenge}`);
		const verificationInput = {
			...webAuthnResponse,
			id: Buffer.from(webAuthnResponse.id, "base64url"),
			// id: webAuthnResponse.id,
			rawId: Buffer.from(webAuthnResponse.rawId, "base64url"),
			response: {
				...webAuthnResponse.response,
				clientDataJSON: Buffer.from(webAuthnResponse.response.clientDataJSON, "base64url"),
				attestationObject: Buffer.from(webAuthnResponse.response.attestationObject, "base64url"),
			},
		};
		const verification = await verifyRegistrationResponse({
			response: verificationInput, // : webAuthnRespons
			expectedChallenge: expectedChallenge,
			expectedOrigin: effectiveOrigin,
			expectedRPID: currentRpConfig.rpId,
			requireUserVerification: false,
		});

		if (verification.verified && verification.registrationInfo) {
			console.log(`Registration verified for ${username}. Storing user data.`);
			const regInfoData = verification.registrationInfo;
			if (!regInfoData || !regInfoData.credentialID || !regInfoData.credentialPublicKey) {
				console.error("Verification successful but registrationInfo is incomplete:", regInfoData);
				throw new Error("Verification succeeded, but credential data was missing.");
			}
			// Store data correctly (as in Vercel version)
			const passKeyDataForStorage = {
				id: Buffer.from(regInfoData.credentialID).toString("base64url"),
				publicKey: Buffer.from(regInfoData.credentialPublicKey).toString("base64"),
				counter: regInfoData.counter,
				deviceType: regInfoData.credentialDeviceType,
				backedUp: regInfoData.credentialBackedUp,
				transports: webAuthnResponse?.response?.transports || [],
			};

			// *** FIX: Use data from body for createUser ***
			await createUser(userId, username, email, passwordHash, passKeyDataForStorage);

			// *** FIX: Remove cookie clearing ***
			return {
				statusCode: 200,
				headers: commonHeaders, // No Set-Cookie header
				body: JSON.stringify({ verified: true }),
			};
		} else {
			console.warn("WebAuthn registration verification failed:", verification);
			return { statusCode: 400, headers: commonHeaders, body: JSON.stringify({ verified: false, error: "Passkey verification failed." }) };
		}
	} catch (error) {
		console.error(`Error verifying registration response for ${username}:`, error);
		console.error("WebAuthn Response received:", webAuthnResponse);
		console.error("Expected Challenge:", expectedChallenge);
		return { statusCode: 500, headers: commonHeaders, body: JSON.stringify({ error: "Internal server error during registration verification." }) };
	}
};
