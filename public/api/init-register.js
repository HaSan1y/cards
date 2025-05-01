const { generateRegistrationOptions } = require("@simplewebauthn/server");
const crypto = require("crypto");
const { getUserByEmail } = require("./db/vercelDB.js");
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

//////////////////////////////////////////////////////////////////////////////////////////////verce
module.exports = async (req, res) => {
	const origin = req.headers.origin;
	const host = req.headers.host;
	console.log(`[Vercel Init-Register] Received Request: Method=${req.method}, Origin='${origin}', Host='${host}'`);
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
	}
	// 	const ALLOWED_ORIGINS = new Set([
	//   'http://localhost:3000',
	//   'http://localhost:8888',
	//   'https://db-2-cards.vercel.app',
	//   'https://elegant-bubblegum-a62895.netlify.app'
	// ]);

	// const HOST_TO_ORIGIN = {
	//   'localhost:3000': 'http://localhost:3000',
	//   'localhost:8888': 'http://localhost:8888',
	//   'db-2-cards.vercel.app': 'https://db-2-cards.vercel.app',
	//   'elegant-bubblegum-a62895.netlify.app': 'https://elegant-bubblegum-a62895.netlify.app'
	// };
	// Check 2: Allow same-origin from localhost (Origin header is missing, but host matches)
	else if (!origin) {
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

	// --- CORS Preflight Handling (OPTIONS request) ---
	if (req.method === "OPTIONS") {
		if (isAllowed && RP_CONFIG[effectiveOrigin]) {
			res.setHeader("Access-Control-Allow-Origin", effectiveOrigin);
			res.setHeader("Access-Control-Allow-Credentials", "true");
			res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
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
	res.setHeader("Access-Control-Allow-Origin", effectiveOrigin);
	res.setHeader("Access-Control-Allow-Credentials", "true");
	res.setHeader("Content-Type", "application/json");
	const currentRpConfig = RP_CONFIG[effectiveOrigin];
	if (!currentRpConfig) {
		console.error(`No RP config found for allowed origin: ${effectiveOrigin}`);
		return res.status(500).json({ error: "Server configuration error for origin" });
	}
	const email = req.query.email;
	if (!email) {
		return res.status(400).json({ error: "Email is required" });
	}

	// const excludeCredentials = existingUser?.passKey?.id ? [{ id: Buffer.from(existingUser.passKey.id, "base64url"), type: "public-key" }] : [];
	const existingUser = await getUserByEmail(email);
	if (existingUser) {
		// Check if not null/undefined
		console.log(`Registration init failed: Email ${email} already exists.`);
		return res.status(400).json({ error: "Email already registered" });
	}
	try {
		console.log(`Generating registration options for email: ${email}`);
		let userIdBuffer;
		if (existingUser && existingUser.id) {
			userIdBuffer = Buffer.from(existingUser.id, "base64url");
		} else {
			userIdBuffer = crypto.randomBytes(16);
		}
		const options = await generateRegistrationOptions({
			rpId: currentRpConfig.rpId,
			rpName: currentRpConfig.rpName,
			//  userID: isoUint8Array.fromUTF8String('customUserIDHere'),
			user: {
				id: userIdBuffer,
				name: email,
				displayName: email,
			},
			attestationType: "none", // Optional: 'none' is common for less strict requirements
			authenticatorSelection: {
				residentKey: "preferred", // Allow discoverable credentials (passkeys)
				requireResidentKey: false,
				userVerification: "preferred", // Prefer biometrics/PIN but don't require
			},
			// excludeCredentials: [], // Can be used if you track multiple credentials per user
		});
		console.log(`Generated options for ${email}. User ID: ${options.user.id}, Challenge: ${options.challenge}`);

		// res.cookie(
		// res.setHeader(
		// 	"Set-Cookie",
		// 	`regInfo=${encodeURIComponent(
		// 		JSON.stringify({
		// 			userId: options.user.id,
		// 			email,
		// 			challenge: options.challenge,
		// 		}),
		// 	)}; HttpOnly; Path=/; Max-Age=60; Secure; SameSite=None`,
		// );
		return res.status(200).json({
			options: options,
			challenge: options.challenge, // Pass challenge needed for verification
			userId: options.user.id, // Pass generated user ID needed for verification/creation
			email: email, // Pass email back for confirmation/use in verify step
		});
	} catch (error) {
		console.error("Error generating registration options:", error);
		return res.status(500).json({ error: "Failed to initialize registration" });
	}
};
