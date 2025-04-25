const { generateRegistrationOptions } = require("@simplewebauthn/server");
const { getUserByEmail, createUser } = require("./db/wds-basicDB.js");
// const { getUserByEmail, createUser } = require("./db/vercelDB.js");
const ALLOWED_ORIGINS = [
	"http://localhost:3000", // Local development
	"https://db-2-cards.vercel.app", // Vercel deployment
	"https://elegant-bubblegum-a62895.netlify.app", // Netlify deployment (if used)
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
};

// test0 pw empty, test1
// --- Test User Creation (Keep for testing if needed) ---
// It's generally better to have a proper database, but for testing:
// if (getUserByEmail("test0@example.com") == null) {
// 	createUser("testuser0", "test0@example.com", {
// 		id: "some-id", // This needs to be a valid Base64URL encoded ID for actual testing
// 		transports: ["internal"], // Example transport
// 	});
// }
// if (getUserByEmail("test1@example.com") == null) {
// 	createUser("testuser1", "test1@example.com", {});
// }
// createUser("testuser1", "test1@example.com", {});
// --- End Test User Creation ---

//////////////////////////////////////////////////////////////////////////////////////////////verce
module.exports = async (req, res) => {
	const origin = req.headers.origin;
	const host = req.headers.host; // e.g., 'localhost:3000'
	console.log(`[Vercel Init-Register] Received Request: Method=${req.method}, Origin='${origin}', Host='${host}'`);
	let isAllowed = false;
	let effectiveOrigin = origin; // Will store the origin to use in response headers

	// Check 1: Standard CORS check (Origin header is present and allowed)
	if (origin && ALLOWED_ORIGINS.includes(origin)) {
		isAllowed = true;
		effectiveOrigin = origin;
	}
	// Check 2: Allow same-origin from localhost (Origin header is missing, but host matches)
	else if (!origin && host === "localhost:3000") {
		// This assumes your local dev server runs on port 3000
		isAllowed = true;
		// For the response header, reconstruct the expected local origin
		effectiveOrigin = "http://localhost:3000";
		console.warn("Allowing same-origin request from host 'localhost:3000' (Origin header undefined).");
	}

	// --- CORS Preflight Handling (OPTIONS request) ---
	if (req.method === "OPTIONS") {
		if (isAllowed) {
			res.setHeader("Access-Control-Allow-Origin", effectiveOrigin); // Use effectiveOrigin
			res.setHeader("Access-Control-Allow-Credentials", "true");
			res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
			res.setHeader("Access-Control-Allow-Headers", "Content-Type");
			return res.status(204).end();
		} else {
			console.error(`OPTIONS request blocked: Origin='${origin}', Host='${host}'`);
			return res.status(403).json({ error: "Origin not allowed" });
		}
	}

	// --- Actual Request Handling ---
	if (!isAllowed) {
		console.error(`Request blocked: Origin='${origin}', Host='${host}'. Allowed Origins: ${ALLOWED_ORIGINS.join(", ")}`);
		return res.status(403).json({ error: "Invalid request origin/host" });
	}
	res.setHeader("Access-Control-Allow-Origin", effectiveOrigin); // Crucial: Allow the specific valid origin
	res.setHeader("Access-Control-Allow-Credentials", "true");
	res.setHeader("Content-Type", "application/json"); // Set common headers
	const currentRpConfig = RP_CONFIG[effectiveOrigin];
	if (!currentRpConfig) {
		console.error(`No RP config found for allowed origin: ${effectiveOrigin}`);
		return res.status(500).json({ error: "Server configuration error for origin" });
	}
	const email = req.query.email;
	if (!email) {
		return res.status(400).json({ error: "Email is required" });
	}

	if (getUserByEmail(email) != null) {
		return res.status(400).json({ error: "User already exists" });
	}
	try {
		const options = await generateRegistrationOptions({
			rpID: currentRpConfig.rpId, // Use RP ID based on origin
			rpName: currentRpConfig.rpName, // Use RP Name based on origin
			userName: email,
			// Optional: Prevent users from registering multiple credentials if they already have one
			// excludeCredentials: existingUser?.passKey?.id ? [{ id: existingUser.passKey.id, type: 'public-key' }] : [],
			authenticatorSelection: {
				// userVerification: 'preferred', // 'preferred', 'required', 'discouraged'
				// residentKey: 'preferred', // 'preferred', 'required', 'discouraged' (for discoverable credentials)
			},
		});
		// res.cookie(
		res.setHeader(
			"Set-Cookie",
			`regInfo=${encodeURIComponent(
				JSON.stringify({
					userId: options.user.id,
					email,
					challenge: options.challenge,
				}),
			)}; HttpOnly; Path=/; Max-Age=60; Secure; SameSite=None`,
		);
		return res.status(200).json(options);
	} catch (error) {
		console.error("Error generating registration options:", error);
		return res.status(500).json({ error: "Failed to initialize registration" });
	}
};

//////////////////////////////////////////////////////////////////////////////////////////////net
exports.handler = async (event) => {
	// const params = new URLSearchParams(event.queryStringParameters);
	// const email = params.get("email");
	const origin = event.headers.origin;
	const httpMethod = event.httpMethod;
	if (httpMethod === "OPTIONS") {
		if (ALLOWED_ORIGINS.includes(origin)) {
			return {
				statusCode: 204, // No Content
				headers: {
					"Access-Control-Allow-Origin": origin, // Echo back the allowed origin
					"Access-Control-Allow-Credentials": "true",
					"Access-Control-Allow-Methods": "GET, POST, OPTIONS", // Adjust methods as needed
					"Access-Control-Allow-Headers": "Content-Type", // Adjust headers as needed
				},
				body: "", // No body needed for preflight
			};
		} else {
			// Origin not allowed for preflight
			return {
				statusCode: 403,
				headers: {
					"Content-Type": "application/json",
					// Do NOT send Allow-Origin header if the origin is truly disallowed
				},
				body: JSON.stringify({ error: "Origin not allowed" }),
			};
		}
	}

	const commonHeaders = {
		"Access-Control-Allow-Origin": origin, // CRUCIAL: Use the specific validated origin
		"Access-Control-Allow-Credentials": "true",
		"Content-Type": "application/json",
	};

	// 3. Get RP Config for this origin
	const currentRpConfig = RP_CONFIG[origin];
	if (!currentRpConfig) {
		console.error(`No RP config found for allowed origin: ${origin}`);
		return {
			statusCode: 500,
			headers: commonHeaders, // Include CORS headers even for server errors if origin was initially allowed
			body: JSON.stringify({ error: "Server configuration error for origin" }),
		};
	}
	const email = event.queryStringParameters?.email;
	if (!email)
		return {
			statusCode: 400,
			headers: commonHeaders,
			body: JSON.stringify({ error: "Email is required" }),
		};
	if (getUserByEmail(email))
		return {
			statusCode: 400,
			headers: commonHeaders,
			body: JSON.stringify({ error: "User already exists" }),
		};
	try {
		const options = await generateRegistrationOptions({
			rpID: currentRpConfig.rpId,
			rpName: currentRpConfig.rpName,
			userName: email,
			authenticatorSelection: {
				// userVerification: 'preferred', // 'preferred', 'required', 'discouraged'
				// residentKey: 'preferred', // 'preferred', 'required', 'discouraged' (for discoverable credentials)
			},
			// Optional: Exclude existing credentials if user somehow exists but check failed above
			// excludeCredentials: existingUser?.passKey?.id ? [{ id: existingUser.passKey.id, type: 'public-key' }] : [],
		});

		return {
			statusCode: 200,
			headers: {
				...commonHeaders,
				"Set-Cookie": `regInfo=${encodeURIComponent(
					JSON.stringify({
						userId: options.user.id,
						email,
						challenge: options.challenge,
					}),
				)}; HttpOnly; Path=/; Max-Age=60; Secure; SameSite=None`,
			},
			body: JSON.stringify(options),
		};
	} catch (error) {
		console.error("Error generating registration options:", error);
		return {
			statusCode: 500,
			headers: commonHeaders,
			body: JSON.stringify({ error: "Failed to initialize registration" }),
		};
	}
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
