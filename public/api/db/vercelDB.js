const { kv } = require("@vercel/kv");
const { Buffer } = require("buffer");

async function createUser(userId, username, email, passwordHash, passKeyData) {
	console.log(`KV: Creating user ${username} with ID ${userId}`);
	const user = {
		id: userId,
		username,
		email,
		passwordHash,
		passKey: passKeyData,
	};

	await kv.set(`user:${userId}`, user);
	await kv.set(`user_by_username:${username}`, userId);
	if (email) {
		// Only set email index if email is provided
		await kv.set(`user_by_email:${email}`, userId);
	}
	console.log(`KV: User ${username} created successfully.`);
	return user;
}

async function getUserByUsername(username) {
	console.log(`KV: Searching for user with username: ${username}`);
	// 1. Find the user ID associated with the username
	const userId = await kv.get(`user_by_username:${username}`);
	if (!userId) {
		console.log(`KV: No user ID found for username: ${username}`);
		return null;
	}
	// 2. Retrieve the full user object using the ID
	const user = await kv.get(`user:${userId}`);
	if (!user) {
		console.log(`KV: No user data found for user ID: ${userId}`);
		return null;
	}
	// console.log(`KV: Found user for ID ${userId}:`, user ? "User data retrieved" : "User data not found");
	return user;
}

async function getUserById(userId) {
	console.log(`KV: Searching for user with ID: ${userId}`);
	const user = await kv.get(`user:${userId}`);
	if (!user) {
		console.log(`KV: No user data found for user ID: ${userId}`);
		return null;
	}
	console.log(`KV: Found user for ID ${userId}:`, user ? "User data retrieved" : "User data not found");
	return user;
}
async function getUserByEmail(email) {
	console.log(`KV: Searching for user with email: ${email}`);
	// 1. Find the user ID associated with the email
	const userId = await kv.get(`user_by_email:${email}`); // <-- Use the correct index key
	if (!userId) {
		console.log(`KV: No user ID found for email: ${email}`);
		return null;
	}
	// 2. Retrieve the full user object using the ID
	console.log(`KV: Found user ID ${userId} for email ${email}. Fetching user object.`);
	const user = await kv.get(`user:${userId}`);
	if (!user) {
		console.log(`KV: No user data found for user ID: ${userId}`);
		return null;
	}
	console.log(`KV: Found user for ID ${userId}:`, user ? "User data retrieved" : "User data not found");
	return user;
}

async function updateUserCounter(userId, newCounter) {
	console.log(`KV: Updating counter for user ID ${userId} to ${newCounter}`);
	const user = await getUserById(userId);
	if (!user) {
		console.error(`KV: Cannot update counter, user not found: ${userId}`);
		return;
	}
	user.passKey.counter = newCounter;
	await kv.set(`user:${userId}`, user);
	console.log(`KV: Counter updated for user ${userId}.`);
}
async function addPassKeyToUser(userId, passKeyData) {
	console.log(`KV: Adding/Updating passkey for user ID ${userId}`);
	const user = await getUserById(userId);
	if (!user) {
		console.error(`KV: Cannot add passkey, user not found: ${userId}`);
		return null;
	}
	user.passKey = passKeyData;
	await kv.set(`user:${userId}`, user);
	console.log(`KV: Passkey added/updated for user ${userId}.`);
	return user;
}
async function getUserPassKeyForVerification(userId) {
	console.log(`KV: Getting passkey for verification for user ID: ${userId}`);
	const user = await getUserById(userId);
	if (!user) {
		console.error(`KV: User not found for verification: ${userId}`);
		return null;
	}
	if (!user.passKey || typeof user.passKey !== "object" || typeof user.passKey.id !== "string" || typeof user.passKey.publicKey !== "string") {
		console.warn(`KV: User ${userId} found, but has incomplete, missing, or incorrectly typed passKey data for verification.`);
		console.warn(`KV: passKey data:`, user.passKey); // Log the problematic data
		return null;
	}
	try {
		// --- Convert stored Base64/Base64URL back to Buffers ---
		// SimpleWebAuthn expects credentialID as raw bytes (Buffer/Uint8Array)
		// Assuming user.passKey.id is stored as Base64URL
		const credentialIDBuffer = Buffer.from(user.passKey.id, "base64url");

		// Assuming user.passKey.publicKey is stored as standard Base64
		const credentialPublicKeyBuffer = Buffer.from(user.passKey.publicKey, "base64");
		const counter = typeof user.passKey.counter === "number" ? user.passKey.counter : 0; // Default to 0 if invalid/missing

		return {
			credentialID: credentialIDBuffer,
			credentialPublicKey: credentialPublicKeyBuffer,
			counter: counter,
			transports: Array.isArray(user.passKey.transports) ? user.passKey.transports : undefined,
		};
	} catch (error) {
		console.error(`KV: Error converting passKey data for user ${userId}:`, error);
		console.error(`KV: Faulty passKey data:`, user.passKey); // Log the problematic data
		return null;
	}
}
module.exports = {
	createUser,
	updateUserCounter,
	getUserPassKeyForVerification,
	getUserById,
	getUserByUsername,
	getUserByEmail,
	addPassKeyToUser,
};
