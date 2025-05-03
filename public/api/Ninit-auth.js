const { generateAuthenticationOptions } = require("@simplewebauthn/server");
// const { getUserByUsername } = require("./db/wds-basicDB.js");
const { getUserByUsername, getUserById, getUserPassKeyForVerification } = require("./db/vercelDB.js");
const bcrypt = require("bcrypt");
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

exports.handler = async (event) => {
	const origin = event.headers.origin;
	const host = event.headers.host; //'localhost:8888'
	console.log(`[Vercel Init-Register] Received Request: Method=${event.httpMethod}, Origin='${origin}', Host='${host}'`);
	let isAllowed = false;
	let effectiveOrigin = origin;
	const vercelHost = "db-2-cards.vercel.app";
	const vercelOrigin = "https://db-2-cards.vercel.app";
	const netlifyHost = "elegant-bubblegum-a62895.netlify.app"; // Make sure this is the correct host header value for Netlify
	const netlifyOrigin = "https://elegant-bubblegum-a62895.netlify.app";
	const localhost3000Host = "localhost:3000"; // Keep if you sometimes test against this
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
			console.error(`OPTIONS request blocked: Origin='${origin}', Host='${host}'`);
			return { statusCode: 403, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Origin not allowed" }) };
		}
	}

	if (!isAllowed) {
		console.error(`Request blocked: Origin='${origin}', Host='${host}'.`);
		return { statusCode: 403, headers: commonHeaders, body: JSON.stringify({ error: "Invalid request origin/host" }) };
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
		return { statusCode: 500, headers: commonHeaders, body: JSON.stringify({ error: "Server configuration error for origin" }) };
	}
	let body;
	try {
		body = JSON.parse(event.body);
	} catch (e) {
		console.error("Failed to parse request body:", event.body);
		return { statusCode: 400, headers: commonHeaders, body: JSON.stringify({ error: "Invalid request body." }) };
	}
	const { username, password } = body;
	if (!username || !password) {
		return { statusCode: 400, headers: commonHeaders, body: JSON.stringify({ error: "Username and password are required" }) };
	}

	const user = await getUserByUsername(username);

	if (!user || !user.passwordHash) {
		console.log(`Login failed for ${username}: User not found or no password hash.`);
		return { statusCode: 401, headers: commonHeaders, body: JSON.stringify({ error: "Invalid credentials" }) };
	}

	// *** FIX: Add password validation ***
	let isPasswordValid = false;
	try {
		isPasswordValid = await bcrypt.compare(password, user.passwordHash);
	} catch (compareError) {
		console.error(`Error comparing password for ${username}:`, compareError);
		return { statusCode: 500, headers: commonHeaders, body: JSON.stringify({ error: "Error during authentication process" }) };
	}

	if (!isPasswordValid) {
		console.log(`Login failed for ${username}: Invalid password.`);
		return { statusCode: 401, headers: commonHeaders, body: JSON.stringify({ error: "Invalid username or password" }) };
	}

	console.log(`Password verified for ${username}. Checking for passkey..`);

	// *** FIX: Use getUserPassKeyForVerification ***
	const authenticatorData = await getUserPassKeyForVerification(user.id);
	if (!authenticatorData || !authenticatorData.credentialID) {
		console.log(`User ${username} authenticated with password, but no usable passkey found.`);
		console.log(`Result from getUserPassKeyForVerification:`, authenticatorData);
		return { statusCode: 400, headers: commonHeaders, body: JSON.stringify({ error: "Password correct, but no passkey registered or passkey data is invalid." }) };
	}
	console.log(`  Using Credential ID (Buffer converted to base64url for logging): ${authenticatorData.credentialID.toString("base64url")}`);

	try {
		const options = await generateAuthenticationOptions({
			rpID: currentRpConfig.rpId,
			allowCredentials: [
				// *** FIX: Use data from authenticatorData ***
				{
					id: authenticatorData.credentialID, //.toString("base64url"),
					type: "public-key",
					transports: authenticatorData.transports,
				},
			],
			userVerification: "preferred",
		});

		if (!options || !options.challenge || options.allowCredentials.length === 0) {
			console.warn(`generateAuthenticationOptions returned invalid options for ${username}.`);
			console.warn(`Authenticator Data Sent:`, authenticatorData);
			console.warn(`Generated Options:`, options);
			return { statusCode: 500, headers: commonHeaders, body: JSON.stringify({ error: "Failed to generate valid authentication options." }) };
		}

		console.log(`Successfully generated WebAuthn options for ${username}.`);

		// *** FIX: Return data in body, remove cookie ***
		return {
			statusCode: 200,
			headers: commonHeaders, // No Set-Cookie
			body: JSON.stringify({
				options: options,
				challenge: options.challenge,
				userId: user.id,
			}),
		};
	} catch (error) {
		console.error(`Error generating authentication options for ${username}:`, error);
		console.error(`Authenticator Data used:`, authenticatorData);
		return { statusCode: 500, headers: commonHeaders, body: JSON.stringify({ error: "Failed to generate authentication options" }) };
	}
};
