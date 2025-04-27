import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
// import { startAuthentication, startRegistration } from "@simplewebauthn/browser@10.0.0/dist/bundle/index.umd.min.js | https://cdn.jsdelivr.net/npm/@simplewebauthn/browser@10.0.0/dist/bundle/index.umd.min.js";
console.log("Script loaded"); // This should appear when the page loads
const emailInput = document.querySelector("[data-email]");
const modal = document.querySelector("[data-modal]");
const closeButton = document.querySelector("[data-close]");
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

	toggleMode.addEventListener("change", function () {
		isLoginMode = !isLoginMode;
		updateFormMode();
	});

	function updateFormMode() {
		if (isLoginMode) {
			formTitle.textContent = "Login";
			formDescription.textContent = "Welcome back! Please login to your account.";
			emailGroup.style.display = "none";
			submitButton.textContent = "Login";
			submitButton.removeAttribute("data-signup");
			submitButton.setAttribute("data-login", "");
			toggleLabel.textContent = "Need an account?";
		} else {
			formTitle.textContent = "Register";
			formDescription.textContent = "Create a new account to get started.";
			emailGroup.style.display = "block";
			submitButton.textContent = "Register";
			submitButton.removeAttribute("data-login");
			submitButton.setAttribute("data-signup", "");
			toggleLabel.textContent = "Already have an account?";
		}
		errorMessage.textContent = "";
		successMessage.textContent = "";
	}
	console.log("Form element:", form);
	console.log("Submit button:", submitButton);

	if (submitButton) {
		submitButton.addEventListener("click", async (e) => {
			e.preventDefault();

			const username = document.getElementById("username").value.trim();
			const emailInput = document.getElementById("email");
			const email = emailInput.value.trim();
			const password = document.getElementById("password").value;
			console.log("Form submitted with values:", { username, email, password });

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

			if (submitButton.hasAttribute("data-login")) {
				console.log("Login attempt");
				await login();
				// window.location.reload();
			} else if (submitButton.hasAttribute("data-signup")) {
				console.log("Signup attempt");
				await signup();
				// window.location.reload();
			} else {
				console.log("Button has neither data-login nor data-signup attribute");
				updateFormMode();
			}
		});
	} else {
		console.error("Form element not found");
	}
});

closeButton.addEventListener("click", () => modal.close());
const SERVER_URL =
	window.location.origin === "https://db-2-cards.vercel.app"
		? "https://db-2-cards.vercel.app/api/"
		: window.location.origin === "http://localhost:8888"
		? "http://localhost:8888/.netlify/functions/N"
		: window.location.origin === "https://elegant-bubblegum-a62895.netlify.app"
		? "https://elegant-bubblegum-a62895.netlify.app/.netlify/functions/N"
		: "http://localhost:3000/api/"; // Default to localhost if no match

async function signup() {
	console.log("Register function called");
	const errorMessage = document.getElementById("errorMessage");
	const submitButton = document.getElementById("submitButton");
	try {
		const usernameInput = document.getElementById("username");
		const emailInput = document.getElementById("email");
		const passwordInput = document.getElementById("password"); // Get password input

		const username = usernameInput.value.trim();
		const email = emailInput.value.trim();
		const password = passwordInput.value;
		console.log("Attempting registration for:", username, email);

		// Basic client-side checks
		if (!username) {
			showModalText("Please enter a username");
			return;
		}
		if (!email || !/\S+@\S+\.\S+/.test(email)) {
			// Simple email format check
			showModalText("Please enter a valid email address");
			return;
		}
		if (!password || password.length < 6) {
			// Keep basic length check
			showModalText("Password must be at least 6 characters long");
			return;
		}

		if (submitButton) submitButton.disabled = true;
		// 1. Get challenge from server
		const initResponse = await fetch(`${SERVER_URL}init-register?email=${encodeURIComponent(email)}`, {
			credentials: "include", // Send cookies (like regInfo)
		});

		if (!initResponse.ok) {
			let errorData = { error: `HTTP error! status: ${initResponse.status}` };
			try {
				errorData = await initResponse.json();
			} catch (e) {
				/* Ignore */
			}
			throw new Error(errorData.error || "Registration initialization failed");
		}
		const options = await initResponse.json();
		console.log("Server response:", options);
		// 2. Create passkey
		const regJSON = await startRegistration(options);
		console.log("Registration JSON:", regJSON);
		const verifyBody = {
			...regJSON, // Spread the WebAuthn response object
			username: username, // Add username from form
			email: email, // Add email from form
			password: password, // Add password from form
		};
		// 3. Save passkey in DB
		const verifyResponse = await fetch(`${SERVER_URL}verify-register`, {
			credentials: "include",
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(verifyBody),
		});
		if (submitButton) submitButton.disabled = false;
		const verifyData = await verifyResponse.json();
		if (!verifyResponse.ok) {
			throw new Error(verifyData.error || "Verification failed");
		}
		if (verifyData.verified) {
			showModalText(`Successfully registered ${username}`);
			usernameInput.value = "";
			emailInput.value = "";
			passwordInput.value = "";
		} else {
			showModalText(`Failed to register`);
		}
	} catch (error) {
		if (submitButton) submitButton.disabled = false;
		if (error instanceof DOMException && error.name === "NotAllowedError") {
			// if (error instanceof NotAllowedError) {
			showModalText("Passkey registration cancelled or not supported.");
		} else if (error instanceof Error) {
			showModalText(error.message || "An unknown registration error occurred.");
		} else {
			showModalText("An unexpected error occurred during registration.");
		}
	}
}

async function login() {
	console.log("Login function called");
	const errorMessage = document.getElementById("errorMessage"); // Get error message element
	const submitButton = document.getElementById("submitButton"); // Get submit button
	try {
		const usernameInput = document.getElementById("username");
		const passwordInput = document.getElementById("password"); // Get password input
		const username = usernameInput.value.trim();
		const password = passwordInput.value;
		console.log("Attempting to log in with username:", username);
		if (!username) {
			showModalText("Please enter a username");
			return;
		}
		if (!password) {
			// Keep basic check
			showModalText("Please enter a password");
			return;
		}
		if (submitButton) submitButton.disabled = true;
		// 1. Get challenge from server
		const initResponse = await fetch(`${SERVER_URL}init-auth`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ username, password }),
			credentials: "include",
		});
		if (submitButton) submitButton.disabled = false;
		if (!initResponse.ok) {
			let errorData = { error: `HTTP error! status: ${initResponse.status}` };
			try {
				errorData = await initResponse.json();
			} catch (e) {
				/* Ignore if response is not JSON */
			}
			// Use the specific error from the server if available
			throw new Error(errorData.error || `Authentication failed`);
		}
		const options = await initResponse.json();
		if (options.allowCredentials && options.allowCredentials.length > 0) {
			console.log("Cr ID request:", options.allowCredentials[0].id);
		}
		const authJSON = await startAuthentication(options);
		if (submitButton) submitButton.disabled = true;
		// 3. Verify passkey with DB
		const verifyResponse = await fetch(`${SERVER_URL}verify-auth`, {
			credentials: "include",
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(authJSON),
		});
		if (submitButton) submitButton.disabled = false;
		const verifyData = await verifyResponse.json();
		if (!verifyResponse.ok) {
			throw new Error(verifyData.error || "Verification failed");
			// showModalText(verifyData.error);
		}
		if (verifyData.verified) {
			showModalText(`Successfully logged in ${username}`);
			// window.location.reload();
		} else {
			showModalText(`Failed to log in`);
		}
	} catch (error) {
		if (submitButton) submitButton.disabled = false;
		console.error("Login error:", error);
		if (error instanceof DOMException && error.name === "NotAllowedError") {
			// User cancelled the prompt - this is expected, don't show a scary error
			showModalText("Login cancelled."); // Or just close the modal, or do nothing
		} else if (error instanceof Error) {
			// Handle other errors (network, server errors caught earlier, etc.)
			showModalText(error.message || "An unknown login error occurred.");
		} else {
			// Fallback for unexpected error types
			showModalText("An unexpected error occurred during login.");
		}
	}
}

function showModalText(text) {
	modal.querySelector("[data-content]").innerText = text;
	modal.showModal();
}
