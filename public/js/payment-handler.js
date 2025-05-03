console.log("Payment Handler script loaded.");

document.addEventListener("DOMContentLoaded", () => {
	const confirmButton = document.getElementById("confirm-payment");
	const cancelButton = document.getElementById("cancel-payment");
	const merchantOriginEl = document.getElementById("merchant-origin");
	const paymentTotalEl = document.getElementById("payment-total");
	const methodDataEl = document.getElementById("method-data");
	const statusEl = document.getElementById("status");
	const errorEl = document.getElementById("error-message");

	// --- Get data passed from Service Worker via URL ---
	const urlParams = new URLSearchParams(window.location.search);
	const origin = urlParams.get("origin");
	const totalString = urlParams.get("total");
	const methodDataString = urlParams.get("methodData");
	const paymentRequestId = urlParams.get("paymentRequestId"); // Useful for debugging or advanced scenarios

	console.log("Origin:", origin);
	console.log("Total String:", totalString);
	console.log("Method Data String:", methodDataString);
	console.log("Payment Request ID:", paymentRequestId);

	// --- Display payment details ---
	merchantOriginEl.textContent = origin || "Unknown";
	try {
		const total = JSON.parse(totalString || "{}");
		paymentTotalEl.textContent = `${total.value} ${total.currency}`;
	} catch (e) {
		paymentTotalEl.textContent = "Error parsing total";
		console.error("Error parsing total:", e);
	}
	try {
		const methodData = JSON.parse(methodDataString || "[]");
		methodDataEl.textContent = JSON.stringify(methodData, null, 2); // Pretty print
	} catch (e) {
		methodDataEl.textContent = "Error parsing method data";
		console.error("Error parsing method data:", e);
	}

	// --- Function to send result back to Service Worker ---
	const sendResponseToServiceWorker = (payload) => {
		// Find the service worker controlling this page
		if (navigator.serviceWorker.controller) {
			console.log("Sending message to Service Worker:", payload);
			navigator.serviceWorker.controller.postMessage({
				type: "paymentResponse",
				payload: payload,
			});
			// Optionally close the window after sending
			// window.close();
		} else {
			console.error("No active service worker controller found!");
			errorEl.textContent = "Error: Cannot communicate with Service Worker.";
		}
	};

	// --- Event Listeners ---
	confirmButton.addEventListener("click", async () => {
		statusEl.textContent = "Processing payment...";
		confirmButton.disabled = true;
		cancelButton.disabled = true;
		errorEl.textContent = "";

		try {
			// ******************************************************
			// *** THIS IS WHERE YOUR ACTUAL PAYMENT LOGIC GOES ***
			// ******************************************************
			// - Validate data
			// - Show UI for selecting saved card / entering details (if needed)
			// - Call your backend API / Payment Gateway (Stripe, PayPal, etc.)
			// - Wait for the result from the gateway

			// ** SIMULATED SUCCESS **
			await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate network delay
			const paymentGatewayResponse = {
				// Example structure
				transactionId: `txn_${Date.now()}`,
				status: "success",
				timestamp: new Date().toISOString(),
			};
			console.log("Simulated Payment Gateway Response:", paymentGatewayResponse);

			// Construct the response payload for the Payment Request API
			const paymentResponsePayload = {
				methodName: urlParams.get("methodData") ? JSON.parse(methodDataString)[0].supportedMethods : "unknown", // Get the actual method used
				details: paymentGatewayResponse, // Pass gateway response details
				// payerName: '...', // Optional
				// payerEmail: '...', // Optional
				// payerPhone: '...', // Optional
				// shippingAddress: {...}, // Optional
				// shippingOption: '...', // Optional
			};

			statusEl.textContent = "Payment successful! Sending response...";
			sendResponseToServiceWorker(paymentResponsePayload);
		} catch (paymentError) {
			console.error("Payment processing failed:", paymentError);
			errorEl.textContent = `Payment failed: ${paymentError.message}`;
			statusEl.textContent = "Payment failed.";
			confirmButton.disabled = false;
			cancelButton.disabled = false;

			// Optionally send a failure response back (or just let the user close the window)
			// sendResponseToServiceWorker({ /* structure indicating failure */ });
		}
	});

	cancelButton.addEventListener("click", () => {
		statusEl.textContent = "Payment cancelled.";
		console.log("Payment cancelled by user.");
		// Send a response indicating cancellation (or just close)
		// The Payment Request API spec doesn't have a standard "cancel" payload,
		// often rejecting the promise in the SW or sending a custom failure is done.
		// For simplicity, we can just close the window. The merchant site's
		// PaymentRequest object will likely throw a DOMException 'AbortError'.
		window.close();
	});
});
