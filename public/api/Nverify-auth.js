const { verifyAuthenticationResponse } = require("@simplewebauthn/server");
// const { updateUserCounter, getUserById } = require("./db/wds-basicDB.js");
const { updateUserCounter, getUserById, getUserPassKeyForVerification } = require("./db/vercelDB.js");

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
	const host = event.headers.host;
	console.log(`[Vercel Verify-Auth] Received Request: Method=${event.httpMethod}, Origin='${origin}', Host='${host}'`);
	let isAllowed = false;
	let effectiveOrigin = origin;
	const vercelHost = "db-2-cards.vercel.app";
	const vercelOrigin = "https://db-2-cards.vercel.app";
	const netlifyHost = "elegant-bubblegum-a62895.netlify.app";
	const netlifyOrigin = "https://elegant-bubblegum-a62895.netlify.app";
	const localhost3000Host = "localhost:3000";
	const localhost3000Origin = "http://localhost:3000";
	const localhost8888Host = "localhost:8888";
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
			return {
				statusCode: 204,
				headers: {
					"Access-Control-Allow-Origin": effectiveOrigin,
					"Access-Control-Allow-Credentials": "true",
					"Access-Control-Allow-Methods": "POST, OPTIONS", // POST needed
					"Access-Control-Allow-Headers": "Content-Type",
				},
				body: "",
			};
		} else {
			console.error(`OPTIONS request blocked: Origin='${origin}', Host='${host}'`);
			return { statusCode: 403, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Origin not allowed" }) };
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

	const currentRpConfig = RP_CONFIG[effectiveOrigin];
	if (!currentRpConfig) {
		console.error(`No RP config found for allowed origin: ${effectiveOrigin}`);
		return { statusCode: 500, headers: commonHeaders, body: JSON.stringify({ error: "Server configuration error for origin" }) };
	}
	// --- End CORS ---

	// *** FIX: Get data from body, remove cookie logic ***
	let requestBody;
	try {
		requestBody = JSON.parse(event.body);
	} catch (e) {
		console.error("Failed to parse request body:", event.body);
		return { statusCode: 400, headers: commonHeaders, body: JSON.stringify({ error: "Invalid request body." }) };
	}

	const { expectedChallenge, userId, ...webAuthnResponse } = requestBody;

	// Validate required fields from body
	if (!expectedChallenge || !userId || !webAuthnResponse?.id) {
		console.error("Missing required fields in request body for /Nverify-auth", { expectedChallenge, userId, webAuthnResponse_id: webAuthnResponse?.id });
		return { statusCode: 400, headers: commonHeaders, body: JSON.stringify({ error: "Missing challenge, user ID, or WebAuthn data." }) };
	}

	// *** FIX: Use userId from body ***
	const user = await getUserById(userId);
	if (!user) {
		console.error(`User not found during verification: User ID ${userId}`);
		return { statusCode: 400, headers: commonHeaders, body: JSON.stringify({ error: "User associated with this login attempt not found." }) };
	}

	// *** FIX: Use userId from body ***
	const authenticatorData = await getUserPassKeyForVerification(userId);
	if (!authenticatorData) {
		console.error(`[NVERIFY-AUTH] CRITICAL: getUserPassKeyForVerification returned null or undefined for userId: ${userId}. Cannot proceed with WebAuthn verification.`);
		// Log the user object to see if passKey was missing or malformed there
		const userForDebug = await getUserById(userId);
		console.error(`[NVERIFY-AUTH] User data at time of failure:`, JSON.stringify(userForDebug));
		return { statusCode: 400, headers: commonHeaders, body: JSON.stringify({ error: "Passkey data for this user is missing or invalid. Cannot verify." }) };
	}

	// If authenticatorData is not null, log its contents
	console.log(
		`[NVERIFY-AUTH] Authenticator data for verification (userId: ${userId}):`,
		JSON.stringify(authenticatorData, (key, value) => {
			if (value && value.type === "Buffer" && Array.isArray(value.data)) {
				return `Buffer(<${Buffer.from(value.data).toString("base64url")}>)`;
			}
			if (value instanceof Buffer) {
				// Handle direct Buffer instances too
				return `Buffer(<${value.toString("base64url")}>)`;
			}
			return value;
		}),
	);

	if (!authenticatorData.credentialID || !(authenticatorData.credentialID instanceof Buffer) || authenticatorData.credentialID.length === 0) {
		console.error(
			`[NVERIFY-AUTH] CRITICAL: authenticatorData.credentialID is invalid. Type: ${typeof authenticatorData.credentialID}, IsBuffer: ${authenticatorData.credentialID instanceof Buffer}, Length: ${
				authenticatorData.credentialID?.length
			}`,
		);
		console.error(`[NVERIFY-AUTH] Full authenticatorData (raw):`, authenticatorData);
		return { statusCode: 500, headers: commonHeaders, body: JSON.stringify({ error: "Internal error: Invalid authenticator data structure." }) };
	}
	console.log(
		`[NVERIFY-AUTH] authenticatorData.credentialID is a Buffer of length ${authenticatorData.credentialID.length}, value (base64url): ${authenticatorData.credentialID.toString("base64url")}`,
	);

	// Pre-flight check
	if (!authenticatorData.credentialID) {
		console.error("[NVERIFY-AUTH PRE-FLIGHT CHECK] authenticatorData.credentialID IS FALSY! This is unexpected given previous logs.", authenticatorData.credentialID);
		return { statusCode: 500, headers: commonHeaders, body: JSON.stringify({ error: "Internal pre-flight check: credentialID is falsy." }) };
	} else {
		console.log(
			`[NVERIFY-AUTH PRE-FLIGHT CHECK] authenticatorData.credentialID IS TRUTHY. Type: ${typeof authenticatorData.credentialID}, Is Buffer: ${
				authenticatorData.credentialID instanceof Buffer
			}, Length: ${authenticatorData.credentialID.length}`,
		);
	}

	console.log(`Attempting verification for user ${user.username} (ID: ${userId}) with challenge: ${expectedChallenge}`);

	try {
		const verification = await verifyAuthenticationResponse({
			response: webAuthnResponse.response, // Pass the nested response object
			expectedChallenge: expectedChallenge, // Use challenge from body
			expectedOrigin: effectiveOrigin,
			expectedRPID: currentRpConfig.rpId,
			authenticator: {
				credentialID: authenticatorData.credentialID,
				credentialPublicKey: authenticatorData.credentialPublicKey,
				counter: authenticatorData.counter,
				transports: authenticatorData.transports,
			},
			requireUserVerification: false,
		});

		if (verification.verified) {
			console.log(`Verification successful for user ${user.username} (ID: ${userId}).`);
			try {
				console.log(`Attempting to update counter from ${authenticatorData.counter} to ${verification.authenticationInfo.newCounter}`);
				// *** FIX: Use userId from body ***
				await updateUserCounter(userId, verification.authenticationInfo.newCounter);
				console.log(`Counter updated successfully for user ${userId}.`);
			} catch (updateError) {
				console.error(`!!! FAILED to update counter for user ${userId} after successful verification:`, updateError);
				// Decide if this should prevent login. For now, log and continue.
			}

			// *** FIX: Remove cookie clearing ***
			return {
				statusCode: 200,
				headers: commonHeaders, // No Set-Cookie
				body: JSON.stringify({ verified: true, username: user.username }),
			};
		} else {
			console.warn(`Verification failed for user ${userId}:`, verification);
			return { statusCode: 400, headers: commonHeaders, body: JSON.stringify({ verified: false, error: "Passkey verification failed." }) };
		}
	} catch (error) {
		console.error(`Error during verifyAuthenticationResponse call for user ${userId}:`, error);
		console.error("WebAuthn Response received:", webAuthnResponse);
		console.error("Authenticator data used:", authenticatorData);
		console.error("Expected Challenge:", expectedChallenge);
		return { statusCode: 500, headers: commonHeaders, body: JSON.stringify({ verified: false, error: "Internal server error during authentication." }) };
	}
};
