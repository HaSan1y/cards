const USERS = [];
console.log("DB module loaded");
// test0 pw empty, test1
// --- Test User Creation (Keep for testing if needed) ---
// It's generally better to have a proper database, but for testing:
// if (getUserByEmail("test0@example.com") == null) {
// 	createUser("testuser0", "test0@example.com", {
// 		id: "aGg=", // This needs to be a valid Base64URL encoded ID for actual testing, aGg= hh
// 		transports: ["internal"], // Example transport
// 	});
// }
// if (getUserByEmail("test1@example.com") == null) {
// 	createUser("testuser1", "test1@example.com", {});
// }
// createUser("testuser1", "test1@example.com", {});
// --- End Test User Creation ---
function getUserByUsername(username) {
	console.log("Searching for user with username:", username);
	console.log("Current USERS array:", USERS);
	const user = USERS.find((user) => user.username === username);
	console.log("Found user:", user);
	return user;
}
function getUserByEmail(email) {
	return USERS.find((user) => user.email === email);
}

function getUserById(id) {
	return USERS.find((user) => user.id === id);
}

function createUser(userId, email, passKey) {
	const username = email.split("@")[0]; // Create a username from the email
	const user = {
		id: userId,
		email,
		username,
		passKey: {
			id: passKey.id,
			publicKey: passKey.publicKey,
			counter: passKey.counter,
			deviceType: passKey.deviceType,
			backedUp: passKey.backedUp,
			transports: passKey.transports,
		},
	};
	if (!getUserById(userId) && !getUserByEmail(email)) {
		USERS.push(user);
		console.log("DB: User created:", user);
		return user;
	} else {
		console.warn("DB: Attempted to create duplicate user:", userId, email);
		return getUserByEmail(email) || getUserById(userId);
	}
}

function updateUserCounter(id, newCounter) {
	const user = getUserById(id);
	if (user && user.passKey) {
		// Check user and passKey exist
		user.passKey.counter = newCounter;
		console.log(`DB: Updated counter for ${id} to ${newCounter}`);
	} else {
		console.error(`DB: Failed to update counter for non-existent user or user without passkey: ${id}`);
	}
}
function getUserPassKeyForVerification(userId) {
	const user = getUserById(userId);
	if (!user || !user.passKey) return null;
	// Return the structure needed by verifyAuthenticationResponse authenticator option
	return {
		credentialID: user.passKey.id,
		credentialPublicKey: user.passKey.publicKey,
		counter: user.passKey.counter,
		transports: user.passKey.transports, // Include transports
	};
}
module.exports = {
	createUser,
	updateUserCounter,
	getUserPassKeyForVerification,
	getUserById,
	getUserByUsername,
	getUserByEmail,
};
