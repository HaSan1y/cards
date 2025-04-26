const { generateAuthenticationOptions } = require("@simplewebauthn/server");
// const { getUserByUsername } = require("./db/wds-basicDB.js");
const { getUserByUsername } = require("./db/vercelDB.js");

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
	"http://localhost:8888": {
		rpId: "localhost",
		rpName: "Local Netlify Dev h451",
	},
};

module.exports = async (req, res) => {
	const origin = req.headers.origin;
	const host = req.headers.host; //'localhost:3000'
	console.log(`[Vercel Init-Register] Received Request: Method=${req.method}, Origin='${origin}', Host='${host}'`);
	let isAllowed = false;
	let effectiveOrigin = origin;
	const vercelHost = "db-2-cards.vercel.app";
	const vercelOrigin = "https://db-2-cards.vercel.app";
	const netlifyHost = "elegant-bubblegum-a62895.netlify.app";
	const netlifyOrigin = "https://elegant-bubblegum-a62895.netlify.app";
	const localhostHost = "localhost:3000";
	const localhostOrigin = "http://localhost:3000";
	// Check 1: Standard CORS check (Origin header is present and allowed)
	if (origin && ALLOWED_ORIGINS.includes(origin)) {
		isAllowed = true;
		effectiveOrigin = origin;
	}
	// Check 2: Allow same-origin from localhost (Origin header is missing, but host matches)
	else if (!origin && host === localhostHost) {
		// This assumes your local dev server runs on port 3000
		isAllowed = true;
		// For the response header, reconstruct the expected local origin
		effectiveOrigin = localhostOrigin;
		console.warn("Allowing same-origin request from host 'localhost:3000' (Origin header undefined).");
	} else if (!origin && host === vercelHost) {
		isAllowed = true;
		effectiveOrigin = vercelOrigin; // Use the standard Vercel origin for response headers
		console.warn(`Allowing same-origin request from host '${vercelHost}' (Origin header undefined).`);
	} else if (!origin && host === netlifyHost) {
		isAllowed = true;
		effectiveOrigin = netlifyOrigin; // Use the standard Netlify origin for response headers
		console.warn(`Allowing same-origin request from host '${netlifyHost}' (Origin header undefined).`);
	}
	if (req.method === "OPTIONS") {
		if (isAllowed) {
			res.setHeader("Access-Control-Allow-Origin", effectiveOrigin);
			res.setHeader("Access-Control-Allow-Credentials", "true");
			res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
			res.setHeader("Access-Control-Allow-Headers", "Content-Type");
			return res.status(204).end();
		} else {
			console.error(`OPTIONS request blocked: Origin='${origin}', Host='${host}'`);
			return res.status(403).json({ error: "Origin not allowed" });
		}
	}
	if (!isAllowed) {
		console.error(`Request blocked: Origin='${origin}', Host='${host}'. Allowed Origins: ${ALLOWED_ORIGINS.join(", ")}`);
		return res.status(403).json({ error: "Invalid request origin/host" });
	}

	res.setHeader("Access-Control-Allow-Origin", effectiveOrigin);
	res.setHeader("Access-Control-Allow-Credentials", "true");
	res.setHeader("Content-Type", "application/json");
	const currentRpConfig = RP_CONFIG[effectiveOrigin];
	if (!currentRpConfig) {
		console.error(`No RP config found for allowed origin: ${effectiveOrigin}`);
		return res.status(500).json({ error: "Server configuration error for origin" });
	}
	const username = req.query?.username;
	console.log("Received auth request for username:", username);
	if (!username) {
		return res.status(400).json({ error: "Username is required" });
	}

	const user = await getUserByUsername(username);
	console.log("User found:", user);
	if (!user) {
		return res.status(400).json({ error: "No user for this username" });
	}
	try {
		const options = await generateAuthenticationOptions({
			rpID: currentRpConfig.rpId,
			allowCredentials: user.passKey
				? [
						{
							id: user.passKey.id,
							type: "public-key",
							transports: user.passKey.transports,
						},
				  ]
				: [],
		});

		if (!user.passKey || options.allowCredentials.length === 0) {
			console.warn(`User ${username} has no registered passkeys.`);
			return res.status(400).json({ error: "No passkeys registered for this user." });
		}
		res.setHeader(
			"Set-Cookie",
			`authInfo=${encodeURIComponent(
				JSON.stringify({
					userId: user.id,
					challenge: options.challenge,
				}),
			)}; HttpOnly; Path=/; Max-Age=60; Secure; SameSite=None`,
		);
		return res.status(200).json(options);
	} catch (error) {
		console.error("Error generating authentication options:", error);
		return res.status(500).json({ error: "Failed to generate authentication options" });
	}
};
