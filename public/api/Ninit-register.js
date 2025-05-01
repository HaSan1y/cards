const { generateRegistrationOptions } = require("@simplewebauthn/server");
// const { getUserByEmail } = require("./db/wds-basicDB.js");
const { getUserByEmail } = require("./db/vercelDB.js");
const crypto = require("crypto");
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
	// const params = new URLSearchParams(event.queryStringParameters);
	// const email = params.get("email");
	const origin = event.headers.origin;
	const host = event.headers.host;
	console.log(`[Vercel Init-Register] Received Request: Method=${event.httpMethod}, Origin='${origin}', Host='${host}'`);
	let isAllowed = false;
	let effectiveOrigin = origin; // Will store the origin to use in response headers
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
			return { statusCode: 403, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Origin not allowed" }) };
		}
	}
	const commonHeaders = {
		"Access-Control-Allow-Origin": effectiveOrigin,
		"Access-Control-Allow-Credentials": "true",
		"Content-Type": "application/json",
	};
	if (!isAllowed) {
		console.error(`Request blocked: Origin='${origin}', Host='${host}'. Allowed Origins: ${ALLOWED_ORIGINS.join(", ")}`);
		return {
			statusCode: 403,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ error: "Invalid request origin/host" }),
		};
	}

	// 3. Get RP Config for this origin
	const currentRpConfig = RP_CONFIG[effectiveOrigin];
	if (!currentRpConfig) {
		console.error(`No RP config found for allowed origin: ${effectiveOrigin}`);
		return {
			statusCode: 500,
			headers: commonHeaders,
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
	const existingUser = await getUserByEmail(email);
	if (existingUser != null) {
		return {
			statusCode: 400,
			headers: commonHeaders,
			body: JSON.stringify({ error: "User already exists" }),
		};
	}
	try {
		console.log(`Generating registration options for email: ${email}`);
		const userIdBuffer = crypto.randomBytes(16);
		const options = await generateRegistrationOptions({
			rpName: currentRpConfig.rpName,
			rpId: currentRpConfig.rpId,
			userID: userIdBuffer,
			userName: email,
			userDisplayName: email,
			// user: {
			// 	// Corrected: Use user object
			// 	id: userIdBuffer, // Assign the generated ID
			// 	name: email, // Use email as the required 'name'
			// 	displayName: email, // Use email as the display name
			// },
			attestationType: "none", // Optional: 'none' is common for less strict requirements
			authenticatorSelection: {
				residentKey: "preferred",
				requireResidentKey: false,
				userVerification: "preferred",
			},
			// Optional: Exclude existing credentials if user somehow exists but check failed above
			// excludeCredentials: existingUser?.passKey?.id ? [{ id: existingUser.passKey.id, type: 'public-key' }] : [],
		});
		console.log(`Generated options for ${email}. User ID: ${options.user.id}, Challenge: ${options.challenge}`);
		const userIdBase64Url = userIdBuffer.toString("base64url");

		return {
			statusCode: 200,
			headers: commonHeaders,
			body: JSON.stringify({
				options: options,
				challenge: options.challenge,
				userId: userIdBase64Url,
				email: email,
			}),
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
