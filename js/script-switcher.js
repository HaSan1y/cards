let activeScript = null;

function switchScript() {
	const scripts = ["./js/with-indexdb.js", "./js/client-server/client-crudfs2server.js"];

	// Find the index of the current active script
	const currentIndex = activeScript ? scripts.indexOf(activeScript) : 0;

	// Switch to the next script
	const nextIndex = currentIndex ? 0 : +1;

	// Load the new script
	const newScript = document.createElement("script");
	newScript.src = scripts[nextIndex];
	document.head.appendChild(newScript);

	// Wait for the script to load
	newScript.onload = () => {
		activeScript = scripts[nextIndex];

		// Remove the old script if it exists
		if (currentIndex !== 0) {
			const oldScript = document.querySelector(`script[src="${scripts[currentIndex]}"]`);
			if (oldScript) {
				oldScript.remove();
			}
		}

		// Update output
		updateOutput();
	};

	newScript.onerror = () => {
		console.error(`Failed to load script: ${scripts[nextIndex]}`);
		updateOutput();
	};
}

function updateOutput() {
	const outputDiv = document.getElementById("script-output");
	outputDiv.textContent = activeScript ? `Active script: ${activeScript}` : "No script loaded";
}

// Initial setup
updateOutput();

// Add event listener to switch button
document.getElementById("switch-script").addEventListener("click", switchScript);
