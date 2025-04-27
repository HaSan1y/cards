const { generateAuthenticationOptions } = require("@simplewebauthn/server");
// const { getUserByUsername } = require("./db/wds-basicDB.js");
const { getUserByUsername, getUserPassKeyForVerification } = require("./db/vercelDB.js");
const bcrypt = require("bcrypt");

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
	// const username = req.query?.username;
	const { username, password } = req.body;

	if (!username) {
		return res.status(400).json({ error: "Username is required" });
	}
	if (!password) {
		return res.status(400).json({ error: "Password is required" });
	}

	const user = await getUserByUsername(username);
	console.log("User found:", user);
	if (!user || !user.passwordHash) {
		console.log(`Login failed for ${username}: User not found or no password hash.`);
		return res.status(401).json({ error: "Invalid credentials" });
	}
	const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

	if (!isPasswordValid) {
		// Password does not match
		console.log(`Login failed for ${username}: Invalid password.`);
		return res.status(401).json({ error: "Unauthorized - Invalid credentials" });
	}

	// --- PASSWORD IS VALID ---
	console.log(`Password verified for ${username}. Proceeding with WebAuthn.`);

	// Now, check if the user has a passkey registered for WebAuthn login
	const userPassKey = await getUserPassKeyForVerification(user.id);
	if (!user.passKey || !user.passKey.id) {
		console.log(`User ${username} authenticated with password, but no passkey ID found in user object for WebAuthn options generation.`);
		// You might still want to return an error here if passkey login is mandatory after password
		return res.status(400).json({ error: "Passkey data incomplete for this user." });
	}
	if (!userPassKey) {
		// Password is correct, but no passkey registered.
		// How to handle this?
		// Option 1: Return an error indicating passkey needed.
		// Option 2: Log the user in based on password alone (requires session management).
		// Option 3: Return a specific status/message telling the frontend the password was okay,
		//           but passkey login isn't possible (maybe prompt user to register one).
		console.log(`User ${username} authenticated with password, but no passkey found for WebAuthn.`);

		return res.status(500).json({ error: "Failed to prepare passkey data." });
	}
	try {
		console.log("Generating options with Credential ID:", user.passKey.id);
		console.log("Generating options with Transports:", userPassKey.transports);
		const options = await generateAuthenticationOptions({
			rpID: currentRpConfig.rpId,
			allowCredentials: [
				{
					id: user.passKey.id,
					type: "public-key",
					transports: userPassKey.transports,
				},
			],
			userVerification: "preferred",
		});

		if (options.allowCredentials.length === 0) {
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
			)}; HttpOnly; Path=/; Max-Age=300; Secure; SameSite=None`,
		);
		return res.status(200).json(options);
	} catch (error) {
		console.error("Error generating authentication options:", error);
		return res.status(500).json({ error: "Failed to generate authentication options" });
	}
};
