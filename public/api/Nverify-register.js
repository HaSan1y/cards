const { verifyRegistrationResponse } = require("@simplewebauthn/server");
// const { createUser } = require("./db/wds-basicDB.js");
const { createUser } = require("./db/vercelDB.js");
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

function parseCookies(cookieHeader) {
	const cookies = {};
	if (!cookieHeader) return cookies;
	cookieHeader.split(";").forEach((cookie) => {
		const [name, ...rest] = cookie.trim().split("=");
		cookies[name] = decodeURIComponent(rest.join("="));
	});
	return cookies;
}
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
	const localhost3000Host = "localhost:3000"; // Keep if you sometimes test against this
	const localhost3000Origin = "http://localhost:3000";
	const localhost8888Host = "localhost:8888"; // Common for `netlify dev`
	const localhost8888Origin = "http://localhost:8888";
	const ALLOWED_ORIGINS = [
		localhost3000Origin,
		localhost8888Origin, // Add Netlify dev origin
		vercelOrigin,
		netlifyOrigin,
	];
	// Check 1: Standard CORS check (Origin header is present and allowed)
	if (origin && ALLOWED_ORIGINS.includes(origin)) {
		isAllowed = true;
		effectiveOrigin = origin;
	}
	// Check 2: Allow same-origin from localhost (Origin header is missing, but host matches)
	else if (!origin && host === localhost3000Host) {
		// This assumes your local dev server runs on port 3000
		isAllowed = true;
		// For the response header, reconstruct the expected local origin
		effectiveOrigin = localhost3000Origin;
		console.warn("Allowing same-origin request from host 'localhost:3000' (Origin header undefined).");
	} else if (!origin && host === localhost8888Host) {
		// Check for Netlify dev port
		isAllowed = true;
		effectiveOrigin = localhost8888Origin;
		console.warn("Allowing same-origin request from host 'localhost:8888' (Origin header undefined).");
	} else if (!origin && host === vercelHost) {
		isAllowed = true;
		effectiveOrigin = vercelOrigin; // Use the standard Vercel origin for response headers
		console.warn(`Allowing same-origin request from host '${vercelHost}' (Origin header undefined).`);
	} else if (!origin && host === netlifyHost) {
		isAllowed = true;
		effectiveOrigin = netlifyOrigin; // Use the standard Netlify origin for response headers
		console.warn(`Allowing same-origin request from host '${netlifyHost}' (Origin header undefined).`);
	}
	const httpMethod = event.httpMethod;
	if (httpMethod === "OPTIONS") {
		if (isAllowed) {
			const isValidEffectiveOrigin = RP_CONFIG[effectiveOrigin] && ALLOWED_ORIGINS.includes(effectiveOrigin);
			if (isValidEffectiveOrigin) {
				return {
					statusCode: 204, // No Content
					headers: {
						"Access-Control-Allow-Origin": effectiveOrigin, // Echo back the allowed origin
						"Access-Control-Allow-Credentials": "true",
						"Access-Control-Allow-Methods": "GET, POST, OPTIONS", // Adjust methods as needed
						"Access-Control-Allow-Headers": "Content-Type", // Adjust headers as needed
					},
					body: "", // No body needed for preflight
				};
			} else {
				console.error(`OPTIONS request blocked: Determined origin '${effectiveOrigin}' not configured/allowed. Original Origin='${origin}', Host='${host}'`);
			}
		}
		console.error(`OPTIONS request blocked: Origin='${origin}', Host='${host}'`);
		return {
			statusCode: 403,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ error: "Origin not allowed" }),
		};
	}
	if (!isAllowed) {
		console.error(`Request blocked: Origin='${origin}', Host='${host}'. Allowed Origins: ${ALLOWED_ORIGINS.join(", ")}`);
		return {
			statusCode: 403,
			headers: {
				"Content-Type": "application/json",
				// Do NOT send Allow-Origin header if the origin is truly disallowed
			},
			body: JSON.stringify({ error: "Invalid request origin/host" }),
		};
	}

	const commonHeaders = {
		"Access-Control-Allow-Origin": effectiveOrigin,
		"Access-Control-Allow-Credentials": "true",
		"Content-Type": "application/json",
	};

	// 3. Get RP Config for this origin
	const currentRpConfig = RP_CONFIG[effectiveOrigin];
	if (!currentRpConfig) {
		console.error(`No RP config found for allowed origin: ${effectiveOrigin}`);
		return {
			statusCode: 500,
			headers: commonHeaders, // Include CORS headers even for server errors if origin was initially allowed
			body: JSON.stringify({ error: "Server configuration error for origin" }),
		};
	}
	const cookies = parseCookies(event.headers.cookie);
	const regInfo = cookies.regInfo ? JSON.parse(cookies.regInfo) : null;

	if (!regInfo) {
		return {
			statusCode: 400,
			headers: commonHeaders,
			body: JSON.stringify({ error: "Registration info not found" }),
		};
	}
	const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
	try {
		const verification = await verifyRegistrationResponse({
			response: body,
			expectedChallenge: regInfo.challenge,
			expectedOrigin: effectiveOrigin,
			expectedRPID: currentRpConfig.rpId,
		});

		if (verification.verified && verification.registrationInfo) {
			const regInfoData = verification.registrationInfo;
			// --- Convert binary data to Base64 before storing ---
			const passKeyDataForStorage = {
				id: regInfoData.credentialID,
				publicKey: Buffer.from(regInfoData.credentialPublicKey).toString("base64"),
				counter: regInfoData.counter,
				deviceType: regInfoData.credentialDeviceType,
				backedUp: regInfoData.credentialBackedUp,

				transports: body?.response?.transports,
			};
			const username = regInfo.email.split("@")[0];
			await createUser(regInfo.userId, username, regInfo.email, passKeyDataForStorage);

			return {
				statusCode: 200,
				headers: {
					...commonHeaders,
					"Set-Cookie": `regInfo=; HttpOnly; Path=/; Max-Age=0; Secure; SameSite=None`,
				},
				body: JSON.stringify({ verified: verification.verified }),
			};
		} else {
			return {
				statusCode: 400,
				headers: {
					...commonHeaders,
				},
				body: JSON.stringify({ verified: false, error: "Verification failed" }),
			};
		}
	} catch (error) {
		console.error("Error verifying registration response:", error);
		return {
			statusCode: 500,
			headers: {
				...commonHeaders,
			},
			body: JSON.stringify({ error: "Internal server error" }),
		};
	}
};
