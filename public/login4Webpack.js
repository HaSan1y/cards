import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
// import { startAuthentication, startRegistration } from "@simplewebauthn/browser@10.0.0/dist/bundle/index.umd.min.js | https://cdn.jsdelivr.net/npm/@simplewebauthn/browser@10.0.0/dist/bundle/index.umd.min.js";
console.log("Script loaded"); // This should appear when the page loads
const emailInput = document.querySelector("[data-email]");
const modal = document.querySelector("[data-modal]");
const closeButton = document.querySelector("[data-close]");

const SERVER_URL =
	window.location.origin === "https://db-2-cards.vercel.app"
		? "https://db-2-cards.vercel.app/api/"
		: window.location.origin === "http://localhost:8888"
		? "http://localhost:8888/.netlify/functions/N"
		: window.location.origin === "https://elegant-bubblegum-a62895.netlify.app"
		? "https://elegant-bubblegum-a62895.netlify.app/.netlify/functions/N"
		: "http://localhost:3000/api/"; // Default to localhost if no match

document.addEventListener("DOMContentLoaded", function () {
	console.log("DOM fully loaded");
	const form = document.getElementById("authForm");
	const formTitle = document.getElementById("formTitle");
	const formDescription = document.getElementById("formDescription");
	const emailGroup = document.getElementById("emailGroup");
	const submitButton = document.getElementById("submitButton");
	const toggleMode = document.getElementById("toggleMode");
	const toggleLabel = document.getElementById("toggleLabel");
	const errorMessage = document.getElementById("errorMessage");
	const successMessage = document.getElementById("successMessage");

	let isLoginMode = true;

	updateFormMode();

	toggleMode.addEventListener("change", function () {
		isLoginMode = !isLoginMode;
		updateFormMode();
	});

	function updateFormMode() {
		if (isLoginMode) {
			formTitle.textContent = "Login";
			formDescription.textContent = "Welcome back! Please login to your account.";
			emailGroup.style.display = "none";
			submitButton.textContent = "Login with Passkey";
			submitButton.removeAttribute("data-signup");
			submitButton.setAttribute("data-login", "");
			toggleLabel.textContent = "Need an account?";
		} else {
			formTitle.textContent = "Register";
			formDescription.textContent = "Create a new account to get started.";
			emailGroup.style.display = "block";
			submitButton.textContent = "Register with Passkey";
			submitButton.removeAttribute("data-login");
			submitButton.setAttribute("data-signup", "");
			toggleLabel.textContent = "Already have an account? Login";
		}
		errorMessage.textContent = "";
		successMessage.textContent = "";
		if (submitButton) submitButton.disabled = false;
	}

	if (submitButton) {
		submitButton.addEventListener("click", async (e) => {
			e.preventDefault();

			const usernameInput = document.getElementById("username");
			const emailInput = document.getElementById("email");
			const passwordInput = document.getElementById("password");

			const username = usernameInput.value.trim();
			const email = emailInput ? emailInput.value.trim() : "";
			const password = passwordInput.value;

			errorMessage.textContent = "";
			successMessage.textContent = "";

			if (!username) {
				errorMessage.textContent = "Username is required.";
				return;
			}

			// 2. Check Password (Required always)
			if (!password || password.length < 6) {
				console.log("Password validation failed");
				errorMessage.textContent = "Password is required and must be at least 6 characters long.";
				// You might add password complexity checks here later
				return;
			}

			// 3. Check Email (Required and Valid only in Register mode)
			if (!isLoginMode) {
				// These checks only apply when registering
				if (!email) {
					errorMessage.textContent = "Email is required for registration.";
					return;
				}
				function isValidEmail(email) {
					const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
					return emailRegex.test(email);
				}
				if (!isValidEmail(email)) {
					errorMessage.textContent = "Please enter a valid email address.";
					return;
				}
			}
			console.log("Validation passed. Proceeding with", isLoginMode ? "Login" : "Registration");

			// Disable button to prevent multiple submissions
			submitButton.disabled = true;
			submitButton.textContent = isLoginMode ? "Logging in..." : "Registering...";

			// if (submitButton.hasAttribute("data-login")) {
			// 	console.log("Login attempt");
			// 	await login();
			// 	// window.location.reload();
			// } else if (submitButton.hasAttribute("data-signup")) {
			// 	console.log("Signup attempt");
			// 	await signup();
			// 	// window.location.reload();
			// } else {
			// 	console.log("Button has neither data-login nor data-signup attribute");
			// 	updateFormMode();
			// }
			try {
				// Wrap async calls in try/catch
				if (isLoginMode) {
					console.log("Login attempt");
					await login(username, password);
				} else {
					console.log("Signup attempt");
					await signup(username, email, password);
				}
				// Re-enable button only if no error occurred during the process
				// Note: Success/error messages are handled within login/signup now
				// submitButton.disabled = false; // Re-enabled within login/signup or in finally block
			} catch (error) {
				// Catch errors bubbled up from login/signup if they weren't handled there
				console.error("Unhandled error during auth process:", error);
				errorMessage.textContent = error.message || "An unexpected error occurred.";
			} finally {
				if (submitButton) {
					submitButton.disabled = false;
					updateFormMode();
				}
				// Optional: Ensure button is always re-enabled, regardless of success/failure handled within functions
				// Be careful if login/signup handle redirection, this might run too late or cause flicker
			}
		});
	} else {
		console.error("Submit button element not found");
	}
});

closeButton.addEventListener("click", () => modal.close());

async function signup(username, email, password) {
	console.log("Register function called");
	const errorMessage = document.getElementById("errorMessage");
	// const submitButton = document.getElementById("submitButton");
	const successMessage = document.getElementById("successMessage");

	let expectedChallenge,
		userIdForRegistration,
		emailFromInit = null;

	try {
		// wont work for netlify */N* gotta refactor l8
		const effectiveApiUrl = SERVER_URL.endsWith("/") ? SERVER_URL : SERVER_URL + "/"; // Ensure trailing slash

		// 1. Initialize Registration - Pass email as query param
		const initResponse = await fetch(`${effectiveApiUrl}init-register?email=${encodeURIComponent(email)}`, {
			method: "GET", // Assuming init-register is GET
			headers: { Accept: "application/json" },
			credentials: "include",
		});

		const initData = await initResponse.json(); // Always try to parse JSON

		if (!initResponse.ok) {
			// Use error message from server response if available
			throw new Error(initData.error || `Registration initialization failed (${initResponse.status})`);
		}
		// Check if expected data is present in the response body
		if (!initData.options || !initData.challenge || !initData.userId || !initData.email) {
			console.error("Incomplete data received from init-register:", initData);
			throw new Error("Server did not provide necessary data to start passkey registration.");
		}
		const options = initData.options; // Assuming the response *is* the options object
		// Store the challenge, userId, and email from the response body
		expectedChallenge = initData.challenge;
		userIdForRegistration = initData.userId;
		emailFromInit = initData.email; // Use email confirmed by server

		console.log(`init-register successful. Challenge: ${expectedChallenge}, UserID: ${userIdForRegistration}`);

		// Optional: Verify email consistency (should match)
		if (email !== emailFromInit) {
			console.warn(`Email mismatch between form ('${email}') and init-register response ('${emailFromInit}'). Using server response.`);
			// Decide if this is an error or just use emailFromInit
		}
		// 2. Start WebAuthn Registration Ceremony
		let regJSON;
		try {
			console.log("Calling startRegistration with options:", options);
			regJSON = await startRegistration(options);
			console.log("startRegistration successful:", regJSON);
		} catch (regError) {
			if (regError.name === "InvalidStateError" || regError.name === "NotAllowedError") {
				throw new Error("Passkey registration cancelled or not supported by browser/authenticator.");
			}
			console.error("startRegistration error:", regError);
			throw new Error("Failed to initiate passkey creation.");
		}

		const verifyBody = {
			...regJSON, // Spread the WebAuthn response object
			username, // Add username from form
			email: emailFromInit, // Add email from form
			password, // Add password from form
			expectedChallenge, // Challenge from init-register response
			userId: userIdForRegistration, // User ID from init-register response
		};
		console.log("Calling verify-register with body:", verifyBody);

		const verifyResponse = await fetch(`${effectiveApiUrl}verify-register`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(verifyBody),
			credentials: "include", // Keep if needed
		});

		const verifyData = await verifyResponse.json(); // Always try to parse JSON

		if (!verifyResponse.ok) {
			throw new Error(verifyData.error || `Registration verification failed (${verifyResponse.status})`);
		}

		if (verifyData.verified) {
			console.log("verify-register successful.");
			successMessage.textContent = `Successfully registered ${username}! You can now log in.`;
			showModalText(`Successfully registered ${username}!`);
			document.getElementById("username").value = "";
			document.getElementById("email").value = "";
			document.getElementById("password").value = "";
		} else {
			// This case might not happen if server throws error on failure, but handle defensively
			throw new Error(verifyData.error || "Registration failed after verification.");
		}
	} catch (error) {
		console.error("Registration error:", error);
		errorMessage.textContent = error.message || "An unknown registration error occurred.";
		showModalText(error.message || "An unknown registration error occurred."); // Show error in modal too
		throw error;
	}
}

// --- Login Function ---
async function login(username, password) {
	console.log("Login function called");
	const errorMessage = document.getElementById("errorMessage");
	const successMessage = document.getElementById("successMessage");

	// Store challenge and userId received from init-auth
	let expectedChallenge = null;
	let userIdForVerification = null;

	try {
		// wont work for netlify /N* gotta refactor l8
		const effectiveApiUrl = SERVER_URL.endsWith("/") ? SERVER_URL : SERVER_URL + "/"; // Ensure trailing slash

		console.log(`Calling init-auth for user: ${username}`);
		const initResponse = await fetch(`${effectiveApiUrl}init-auth`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify({ username, password }),
			credentials: "include",
		});

		const initData = await initResponse.json();

		if (!initResponse.ok) {
			// Prioritize server error message
			throw new Error(initData.error || `Authentication initialization failed (${initResponse.status})`);
		}

		// Check if expected data is present
		if (!initData.options || !initData.challenge || !initData.userId) {
			console.error("Incomplete data received from init-auth:", initData);
			throw new Error("Server did not provide necessary data to start passkey login.");
		}

		const options = initData.options;
		expectedChallenge = initData.challenge; // Store challenge
		userIdForVerification = initData.userId; // Store userId
		console.log(`init-auth successful. Challenge: ${expectedChallenge}, UserID: ${userIdForVerification}`);

		// 2. Start WebAuthn Authentication Ceremony
		let authJSON;
		try {
			authJSON = await startAuthentication(options);
			console.log("startAuthentication successful:", authJSON);
		} catch (authError) {
			if (authError.name === "NotAllowedError") {
				throw new Error("Passkey authentication cancelled.");
			}
			console.error("startAuthentication error:", authError);
			throw new Error("Failed to initiate passkey usage.");
		}

		const verifyBody = {
			...authJSON, // Spread the WebAuthn response object
			expectedChallenge, // Add the challenge received from init-auth
			userId: userIdForVerification, // Add the userId received from init-auth
		};

		console.log("Calling verify-auth with body:", verifyBody);
		const verifyResponse = await fetch(`${effectiveApiUrl}verify-auth`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(verifyBody),
			credentials: "include",
		});

		const verifyData = await verifyResponse.json();

		if (!verifyResponse.ok) {
			throw new Error(verifyData.error || `Authentication verification failed (${verifyResponse.status})`);
		}

		if (verifyData.verified) {
			console.log("verify-auth successful.");
			const loggedInUsername = verifyData.username || username;
			successMessage.textContent = `Successfully logged in as ${loggedInUsername}!`;
			showModalText(`Successfully logged in as ${loggedInUsername}!`);
			// TODO: Redirect or update UI for logged-in state
			// window.location.reload(); // Example: Reload page
			document.getElementById("username").value = "";
			document.getElementById("password").value = "";
		} else {
			// This case might not happen if server throws error on failure
			throw new Error(verifyData.error || "Login failed after verification.");
		}
	} catch (error) {
		console.error("Login error:", error);
		errorMessage.textContent = error.message || "An unknown login error occurred.";
		showModalText(error.message || "An unknown login error occurred."); // Show error in modal
	}
}

// --- Utility to show modal ---
function showModalText(text) {
	if (modal && modal.querySelector) {
		const contentElement = modal.querySelector("[data-content]");
		if (contentElement) {
			contentElement.innerText = text;
		} else {
			console.error("Modal content element '[data-content]' not found.");
		}
		if (typeof modal.showModal === "function") {
			modal.showModal();
		} else {
			console.error("Modal element does not have a showModal method.");
		}
	} else {
		console.error("Modal element '[data-modal]' not found.");
		// Fallback alert if modal isn't working
		alert(text);
	}
}
