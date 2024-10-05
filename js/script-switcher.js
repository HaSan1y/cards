let activeScript = null;

let isIDB;

async function switchScript() {
	const modules = ["./js/with-indexdb.js", "./js/client-server/client-crudfs2server.js"];

	const nextIndex = activeScript ? (scripts.indexOf(activeScript) + 1) % scripts.length : 0;

	isIDB = nextIndex === 0;
	try {
		const module = await import(modules[nextIndex]);
		// Call a specific function from the module if needed
		module.init();
		activeScript = modules[nextIndex];
	} catch (error) {
		console.error(`Failed to load module: ${modules[nextIndex]}`, error);
	}

	updateOutput();
	// const currentIndex = activeScript ? scripts.indexOf(activeScript) : 0;
	// const nextIndex = currentIndex ? 0 : currentIndex == 1 ? 0 : +1;
	// const newScript = document.createElement("script");
	// newScript.src = scripts[nextIndex];
	// document.head.appendChild(newScript);
	// if (nextIndex === 0) {
	// 	isIDB = true;
	// } else if (nextIndex === 1) {
	// 	isIDB = false;
	// }
	// newScript.onload = () => {
	// 	activeScript = scripts[nextIndex];
	// 	if (currentIndex !== 0) {
	// 		const oldScript = document.querySelector(`script[src="${scripts[currentIndex]}"]`);
	// 		if (oldScript) {
	// 			oldScript.remove();
	// 		}
	// 	}
	// 	updateOutput();
	// };
	// newScript.onerror = () => {
	// 	console.error(`Failed to load script: ${scripts[nextIndex]}`);
	// 	updateOutput();
	// };
}

function updateOutput() {
	const outputDiv = document.getElementById("script-output");
	outputDiv.textContent = activeScript ? `Active script: ${activeScript}` : "No script loaded";
}

updateOutput();

document.getElementById("switch-script").addEventListener("click", switchScript);
