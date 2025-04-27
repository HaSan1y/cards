const { verifyAuthenticationResponse } = require("@simplewebauthn/server");
// const { updateUserCounter, getUserById } = require("./db/wds-basicDB.js");
const { updateUserCounter, getUserById, getUserPassKeyForVerification } = require("./db/vercelDB.js");

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
			console.error(`OPTIONS request blocked: Origin='${origin}', effectiveOrigin='${effectiveOrigin}' , Host='${host}'`);
			return res.status(403).json({ error: "Origin not allowed" });
		}
	}

	// --- Actual Request Handling ---
	if (!isAllowed) {
		console.error(`Request blocked: Origin='${origin}', effectiveOrigin='${effectiveOrigin}', Host='${host}'. Allowed Origins: ${ALLOWED_ORIGINS.join(", ")}`);
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
	const cookies = parseCookies(req.headers.cookie);
	const authInfo = cookies.authInfo ? JSON.parse(cookies.authInfo) : null;
	console.log("Parsed authInfo cookie:", authInfo); // Log cookie
	if (!authInfo) {
		return res.status(400).json({ error: "Authentication info not found" });
	}
	// try {
	// } catch (error) {
	// 	console.error("Error parsing authInfo cookie:", error);
	// 	return res.status(400).json({ error: "Invalid authentication info" });
	// }
	const user = await getUserById(authInfo.userId);
	if (!user) {
		console.error(`User not found during verification: User ID ${authInfo.userId}`);
		return res.status(400).json({ error: "User associated with this login attempt not found." });
	}
	const authenticatorData = await getUserPassKeyForVerification(user);
	console.log("Data from getUserPassKeyForVerification:", authenticatorData);
	if (!authenticatorData) {
		// Check if user exists and has a passKey object
		console.error(`User validation failed for verification: User ID ${authInfo.userId}`);
		return res.status(400).json({ error: "User not found or no passkey registered for user." });
	}
	try {
		let verification;
		try {
			console.log("Calling verifyAuthenticationResponse with:");
			console.log("  Response:", req.body);
			console.log("  Expected Challenge:", authInfo.challenge);
			console.log("  Expected Origin:", effectiveOrigin);
			console.log("  Expected RPID:", currentRpConfig.rpId);
			console.log("  Authenticator Data:", authenticatorData);
			verification = await verifyAuthenticationResponse({
				response: req.body,
				expectedChallenge: authInfo.challenge,
				expectedOrigin: effectiveOrigin,
				expectedRPID: currentRpConfig.rpId,
				authenticator: authenticatorData,
				//requireUserVerification: false,
			});
			console.log("Verification Result:", verification);
		} catch (verificationError) {
			console.error("!!! Error during verifyAuthenticationResponse call:", verificationError);
			// Rethrow or handle specifically
			throw verificationError; // Pass it to the outer catch
		}

		if (verification.verified) {
			console.log(`Verification successful for user ${authInfo.userId}. Attempting to update counter from ${authenticatorData.counter} to ${verification.authenticationInfo.newCounter}`);
			try {
				await updateUserCounter(authInfo.userId, verification.authenticationInfo.newCounter);
				console.log(`Counter updated successfully for user ${authInfo.userId}.`);
			} catch (updateError) {
				console.error(`!!! FAILED to update counter for user ${authInfo.userId}:`, updateError);
				// Decide how critical this is. Maybe still return success but log the error?
				// For now, let the main error handler catch it if it bubbles up, or just log it.
			}

			res.setHeader("Set-Cookie", `authInfo=; HttpOnly; Path=/; Max-Age=0; Secure; SameSite=None`);
			// Save user in a session cookie
			return res.status(200).json({ verified: true });
		} else {
			console.warn("Verification failed:", verification);
			return res.status(400).json({ verified: false, error: "Passkey Verification failed" });
		}
	} catch (error) {
		console.error("Error verifying authentication response:", error);
		return res.status(500).json({ verified: false, error: "Internal server error during authentication." });
	}
};
