import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
// import { startAuthentication, startRegistration } from "@simplewebauthn/browser@10.0.0/dist/bundle/index.umd.min.js | https://cdn.jsdelivr.net/npm/@simplewebauthn/browser@10.0.0/dist/bundle/index.umd.min.js";
console.log("Script loaded"); // This should appear when the page loads

const emailInput = document.querySelector("[data-email]");
const modal = document.querySelector("[data-modal]");
const closeButton = document.querySelector("[data-close]");
document.addEventListener("DOMContentLoaded", function () {
	console.log("DOM fully loaded");

	const form = document.getElementById("authForm");
	const submitButton = document.getElementById("submitButton");
	console.log("Form element:", form);
	console.log("Submit button:", submitButton);

	if (submitButton) {
		submitButton.addEventListener("click", async (e) => {
			e.preventDefault();
			console.log("Form submitted");

			if (submitButton.hasAttribute("data-login")) {
				console.log("Login attempt");
				await login();
			} else if (submitButton.hasAttribute("data-signup")) {
				console.log("Signup attempt");
				await signup();
			} else {
				console.log("Button has neither data-login nor data-signup attribute");
			}
		});
	} else {
		console.error("Form element not found");
	}
});
closeButton.addEventListener("click", () => modal.close());
const SERVER_URL = "https://db-2-cards.vercel.app/api";
// https://elegant-bubblegum-a62895.netlify.app/.netlify/functions/NetVercelLogin
//http://localhost:3000";

async function signup() {
	console.log("Signup function called");
	try {
		const email = document.querySelector("[data-email]").value;
		console.log("Registering with email:", email);

		// 1. Get challenge from server
		const initResponse = await fetch(`${SERVER_URL}/init-register?email=${email}`, { credentials: "include" });
		if (!initResponse.ok) {
			throw new Error(`HTTP error! status: ${initResponse.status}`);
			// showModalText(options.error);
		}
		const options = await initResponse.json();
		console.log("Server response:", options);
		// 2. Create passkey
		const registrationJSON = await startRegistration(options);
		console.log("Registration JSON:", registrationJSON);

		// 3. Save passkey in DB
		const verifyResponse = await fetch(`${SERVER_URL}/verify-register`, {
			credentials: "include",
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(registrationJSON),
		});

		const verifyData = await verifyResponse.json();
		if (!verifyResponse.ok) {
			showModalText(verifyData.error);
		}
		if (verifyData.verified) {
			showModalText(`Successfully registered ${email}`);
		} else {
			showModalText(`Failed to register`);
		}
	} catch (error) {
		console.error("Signup error:", error);
	}
}

async function login() {
	console.log("Login function called");
	try {
		const usernameInput = document.getElementById("username");
		const username = usernameInput.value;
		console.log("Attempting to log in with username:", username);
		if (!username) {
			showModalText("Please enter a username");
			return;
		}

		// 1. Get challenge from server
		const initResponse = await fetch(`${SERVER_URL}/init-auth?username=${username}`, {
			credentials: "include",
		});
		if (!initResponse.ok) {
			const errorData = await initResponse.json();
			throw new Error(errorData.error || `HTTP error! status: ${initResponse.status}`);

			// showModalText(options.error);
		}
		const options = await initResponse.json();

		// 2. Get passkey
		const authJSON = await startAuthentication(options);

		// 3. Verify passkey with DB
		const verifyResponse = await fetch(`${SERVER_URL}/verify-auth`, {
			credentials: "include",
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(authJSON),
		});

		const verifyData = await verifyResponse.json();
		if (!verifyResponse.ok) {
			throw new Error(verifyData.error || "Verification failed");
			// showModalText(verifyData.error);
		}
		if (verifyData.verified) {
			showModalText(`Successfully logged in ${username}`);
		} else {
			showModalText(`Failed to log in`);
		}
	} catch (error) {
		console.error("Login error:", error);
		// showModalText(error.message);
	}
}

function showModalText(text) {
	modal.querySelector("[data-content]").innerText = text;
	modal.showModal();
}
