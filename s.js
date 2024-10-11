document.addEventListener("DOMContentLoaded", function () {
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

	form.addEventListener("submit", function (e) {
		e.preventDefault();

		const username = document.getElementById("username").value;
		const email = document.getElementById("email").value;
		const password = document.getElementById("password").value;

		errorMessage.textContent = "";
		successMessage.textContent = "";

		if (!username || !password || (!isLoginMode && !email)) {
			errorMessage.textContent = "Please fill in all fields";
			return;
		}

		if (!isLoginMode && !isValidEmail(email)) {
			errorMessage.textContent = "Please enter a valid email address";
			return;
		}

		// Simulate API call
		setTimeout(() => {
			successMessage.textContent = isLoginMode ? "Login successful!" : "Registration successful!";
			form.reset();
		}, 1000);
	});

	function isValidEmail(email) {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}
});
