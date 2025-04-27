const { generateRegistrationOptions, verifyRegistrationResponse } = require("@simplewebauthn/server");
// const { createUser } = require("./db/wds-basicDB.js");
const { createUser, getUserByUsername, getUserByEmail } = require("./db/vercelDB.js");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const saltRounds = 10;

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
	const origin = req.headers.origin;
	const host = req.headers.host; // e.g., 'localhost:3000'
	console.log(`[Vercel Init-Register] Received Request: Method=${req.method}, Origin='${origin}', Host='${host}'`);
	let isAllowed = false;
	let effectiveOrigin = origin; // Will store the origin to use in response headers

	const vercelHost = "db-2-cards.vercel.app";
	const vercelOrigin = "https://db-2-cards.vercel.app";
	const netlifyHost = "elegant-bubblegum-a62895.netlify.app"; // Make sure this is the correct host header value for Netlify
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

	// --- CORS Preflight Handling (OPTIONS request) ---
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
	const { username, email, password, ...webAuthnResponse } = req.body; // Extract username, email, and password from request body

	const cookies = parseCookies(req.headers.cookie);
	const regInfo = cookies.regInfo ? JSON.parse(cookies.regInfo) : null;

	if (!username || !email || !password) {
		console.error("Missing username, email, or password in request body for /verify-register");
		return res.status(400).json({ error: "Missing required registration fields (username, email, password)." });
	}
	if (!regInfo) {
		return res.status(400).json({ error: "Registration session info not found (cookie missing or expired)." });
	}
	// Optional: Check if email from body matches email from cookie for extra safety
	if (email !== regInfo.email) {
		console.error(`Email mismatch: Body='${email}', Cookie='${regInfo.email}'`);
		return res.status(400).json({ error: "Email mismatch during registration." });
	}
	const existingUserByUsername = await getUserByUsername(username);
	if (existingUserByUsername) {
		return res.status(400).json({ error: "Username already taken" }); // response indicating username taken
	}
	const existingUserByEmail = await getUserByEmail(email);
	if (existingUserByEmail) {
		return res.status(400).json({ error: "email already taken" });
	}
	let passwordHash;
	try {
		// Now 'password' should have a value from req.body
		passwordHash = await bcrypt.hash(password, saltRounds);
	} catch (hashError) {
		console.error("Error hashing password:", hashError);
		// Check if it's the specific 'data required' error again, though it shouldn't be now
		if (hashError.message.includes("data and salt arguments required")) {
			console.error("bcrypt error likely due to password still being undefined/null.");
		}
		return res.status(500).json({ error: "Failed to process password." });
	}
	const userId = uuidv4(); // Generate a unique user ID
	try {
		const verification = await verifyRegistrationResponse({
			response: webAuthnResponse,
			expectedChallenge: regInfo.challenge,
			expectedOrigin: effectiveOrigin,
			expectedRPID: currentRpConfig.rpId,
		});

		if (verification.verified && verification.registrationInfo) {
			const regInfoData = verification.registrationInfo;
			// const username = regInfo.email.split("@")[0];
			// const { registrationInfo } = verification;

			const passKeyDataForStorage = {
				id: Buffer.from(regInfoData.credentialID).toString("base64url"),
				publicKey: Buffer.from(regInfoData.credentialPublicKey).toString("base64"),
				counter: regInfoData.counter,
				deviceType: regInfoData.credentialDeviceType,
				backedUp: regInfoData.credentialBackedUp,

				transports: webAuthnResponse?.response?.transports,
			};
			await createUser(userId, username, email, passwordHash, passKeyDataForStorage);
			res.setHeader("Set-Cookie", `regInfo=; HttpOnly; Path=/; Max-Age=0; Secure; SameSite=None`);
			return res.status(200).json({ verified: verification.verified });
		} else {
			console.warn("WebAuthn registration verification failed:", verification);
			return res.status(400).json({ verified: false, error: "Verification failed" });
		}
	} catch (error) {
		console.error("Error verifying registration response:", error);
		return res.status(500).json({ error: "Internal server error" });
	}
};
