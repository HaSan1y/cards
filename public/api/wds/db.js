const USERS = [];
console.log("DB module loaded");

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
			transports: passKey.transports,
		},
	};
	USERS.push(user);
	return user;
}

function updateUserCounter(id, counter) {
	const user = USERS.find((user) => user.id === id);
	user.passKey.counter = counter;
}

module.exports = {
	getUserByUsername,
	getUserByEmail,
	getUserById,
	createUser,
	updateUserCounter,
};
