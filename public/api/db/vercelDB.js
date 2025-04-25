const { kv } = require("@vercel/kv");

async function createUser(userId, username, passKeyData) {
	console.log(`KV: Creating user ${username} with ID ${userId}`);
	const user = {
		id: userId,
		username: username, // Make sure you are storing username if looking up by it later
		passKey: passKeyData,
	};
	// Store by user ID and potentially by username for lookup
	await kv.set(`user:${userId}`, user);
	await kv.set(`user_by_username:${username}`, userId); // Store mapping from username to ID
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
	console.log(`KV: Found user for ID ${userId}:`, user);
	return user;
}

async function getUserById(userId) {
	console.log(`KV: Searching for user with ID: ${userId}`);
	const user = await kv.get(`user:${userId}`);
	console.log(`KV: Found user for ID ${userId}:`, user);
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
	await kv.set(`user:${userId}`, user); // Overwrite the user object with the updated counter
}

module.exports = {
	createUser,
	getUserByUsername,
	getUserById,
	updateUserCounter,
};
