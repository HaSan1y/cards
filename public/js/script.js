// import "htmx.org";
// import "/initiate-htmx.js";
// document.addEventListener("DOMContentLoaded", () => {
// 	const htmxButton = document.getElementById("htmx-proxy");
// 	const currentUrl = window.location.origin;
// 	console.log("Current URL:", currentUrl);
// 	if (currentUrl.includes("netlify.app")) {
// 		htmxButton.setAttribute("hx-get", "/.netlify/functions/Uhtmx-joke");
// 	} else if (currentUrl.includes("vercel.app") || currentUrl.includes("localhost:3000") || currentUrl.includes("localhost:8888")) {
// 		htmxButton.setAttribute("hx-get", "/api/Uhtmx-joke");
// 	} else {
// 		console.log("Unknown URL, no API endpoint configured.");
// 	}
// });

document.addEventListener("DOMContentLoaded", () => {
	// --- Service Worker Registration ---
	if ("serviceWorker" in navigator) {
		navigator.serviceWorker
			.register("/sw.js") // Path relative to origin root
			.then((registration) => {
				console.log("Service Worker registered with scope:", registration.scope);
			})
			.catch((error) => {
				console.error("Service Worker registration failed:", error);
			});
	} else {
		console.log("Service Worker not supported in this browser.");
	}
	// --- End Service Worker Registration ---
	const repoSelectElements = document.getElementsByClassName("repoSelect");

	for (let i = 0; i < repoSelectElements.length; i++) {
		repoSelectElements[i].addEventListener("change", function (e) {
			const selected = this.options[this.selectedIndex];

			if (selected.dataset.url) {
				window.open(selected.dataset.url);
				this.blur();
			}
		});
	}
});
const cookieBox = document.querySelector(".wrapper");
const buttons = document.querySelectorAll(".butt");
const disc = document.querySelector("#disclaimerModal");

// cookie+disclaimer//////////////////////////////////////////////////////////////////////////////
const executeCodes = () => {
	if (!document.cookie.includes("cookie-consent")) {
		cookieBox.classList.add("show");
		buttons.forEach((button) => {
			button.addEventListener("click", () => {
				cookieBox.classList.remove("show");
				if (button.id == "acceptBtn") {
					//cookies for 1 month 60=1min* 60=1hr* 30=30days samesitestrict only within the orignpage
					return (document.cookie = "cookieBy= ${cookie-consent}; SameSite=Strict; max-age= " + 60 * 60 * 24 * 7);
				}
			});
		});
	}
	//terms disabled
	// if (!document.cookie.includes("terms-accepted") ) {
	// 	closeDisclaimerModal.addEventListener("click", () => {
	// 		if (acknowledgeDisclaimer.checked) {
	// 			document.cookie = "acpttermsBy= ${terms-accepted}; SameSite=Strict; max-age= " + 60 * 60 * 24 * 30;
	// 			document.body.style.overflow = "auto";
	// 			disc.remove();
	// 		} else {
	// 			body.classList.add("hide");
	// 			document.body.style.overflow = "hidden";
	// 		}
	// 	});
	// } else {
	// 	document.body.style.overflow = "auto";
	// 	disc.remove();
	// }
};

//3state slider//////////////////////////////////////////////////////////////////////////////////////////
// function filterme(value) {
// 	value = parseInt(value, 10); // Convert to an integer
// 	var customToggle = document.getElementById("custom-toggle");
// 	var spanElements = document.querySelectorAll("span");

// 	if (value === 1) {
// 		customToggle.classList.remove("tgl-off", "tgl-def");
// 		customToggle.classList.add("tgl-on");
// 		spanElements.forEach(function (span) {
// 			span.textContent = "Enabled";
// 		});
// 	} else if (value === 2) {
// 		customToggle.classList.remove("tgl-on", "tgl-off");
// 		customToggle.classList.add("tgl-def");
// 		spanElements.forEach(function (span) {
// 			span.textContent = "Undetermined";
// 		});
// 	} else if (value === 3) {
// 		customToggle.classList.remove("tgl-def", "tgl-on");
// 		customToggle.classList.add("tgl-off");
// 		spanElements.forEach(function (span) {
// 			span.textContent = "Disabled";
// 		});
// 	}
// }

// theme switcher//////////////////////////////////////////////////////////////////////////////////////////
const colorThemes = document.querySelectorAll('[name="theme"]');
const storeTheme = function (theme) {
	localStorage.setItem("theme", theme);
};
const setTheme = function () {
	const activeTheme = localStorage.getItem("theme");
	colorThemes.forEach((themeOption) => {
		if (themeOption.id === activeTheme) {
			themeOption.checked = true;
		}
	});
	document.documentElement.className = activeTheme;
};
colorThemes.forEach((themeOption) => {
	themeOption.addEventListener("click", () => {
		storeTheme(themeOption.id);
		document.documentElement.className = themeOption.id;
	});
});

/// on hover theme switch////////////////////////////////////////////////////////////////////////////////
const colorOptions = document.querySelectorAll(".color-option");

colorOptions.forEach((option) => {
	option.addEventListener("mouseover", () => {
		const radioInput = option.querySelector('input[type="radio"]');
		radioInput.checked = true;
	});
});

// window.addEventListener("load", () => {document.onload = ;
executeCodes();
setTheme();

// const formx = document.querySelector('form.xx');
// formx.addEventListener('submit', (e) => {
//   e.preventDefault(); ///
//   const files = document.getElementById("files");
//   const formData = new FormData();
//   //  formData.append("name", name.value);
//   for (let i = 0; i < files.files.length; i++) {
//     formData.append("files", files.files[i]);
//   }
//   fetch('http://127.0.0.1:5000/api', {
//     method: 'POST',
//     body: formData,
//   })
//     .then(res => res.json())
//     .then(data => console.log(data));
// })
// });

// database switcher
const cardHolder = document.getElementById("cardHolder");
// let currentStorageType = "session";
window.currentStorageType = "session"; // Make it explicitly global

window.switchDatabase = async function switchDatabase() {
	console.log("Switching database");
	var select = document.getElementById("selectswitchdb");
	var selectedValue = select.value;

	if (selectedValue === "htmx") {
		document.getElementById("htmx-proxy").style.display = "block";
		document.getElementById("imgg").style.display = "block";
		const getApiUrl = () => {
			const currentUrl = window.location.origin;

			if (currentUrl === "https://db-2-cards.vercel.app" || currentUrl === "http://localhost:3000") {
				return "/api/vercel-proxy?type=image";
			} else if (currentUrl === "https://elegant-bubblegum-a62895.netlify.app" || currentUrl === "http://localhost:8888") {
				return "/.netlify/functions/net-proxy?path=images";
			} else {
				console.error("Unknown URL, no API endpoint configured.");
				return null;
			}
		};

		const apiUrl = getApiUrl();
		document.getElementById("imgg").setAttribute("src", "");
		if (apiUrl) {
			fetch(`${apiUrl}&random=${Date.now()}`, {
				method: "GET",
				cache: "no-store", // Prevent caching
				headers: {
					"Cache-Control": "no-cache, no-store, must-revalidate", // HTTP headers to disable caching
					Pragma: "no-cache",
					Expires: "0",
				},
			})
				.then((response) => {
					// console.log("API Response:", response);
					if (!response.ok) {
						throw new Error("Network response was not ok " + response.statusText);
					}
					document.getElementById("imgg").setAttribute("src", response.url || "No image found");
				})
				.catch((error) => console.error("Error:", error));
		} else {
			console.error("No API endpoint configured.");
		}

		// const supabase = createClient(window.__ENV__.SUPABASE_URL, window.__ENV__.SUPABASE_ANON_KEY);
		// const supabase = createClient(X);
		// const { data, error } = await supabase
		// 	.from("notes")
		// 	 .insert({
		// 	 	title: "note.title",
		// 	 });
		// 	.select("*")
		// 	.order("id", { ascending: false })
		// 	.limit(2);
		// console.log(data);
		// if (error) {
		// 	throw error;
		// }
	}
	const isServer = selectedValue === "server";
	const isIndexDB = selectedValue === "indexdb";
	const isSessionDB = selectedValue === "sessiondb";
	const isLocalDB = selectedValue === "localdb";
	// const isCacheDB = selectedValue === "cachedb";
	if (isServer) {
		console.log("Switching to server database");
		const ssubmitButtonContainer = document.getElementById("dbbtn");
		const nnewSubmitButton = document.createElement("button");
		nnewSubmitButton.textContent = "Add text to Server";
		nnewSubmitButton.type = "submit";
		nnewSubmitButton.classList.add("btn-primary");
		nnewSubmitButton.id = "serversubmitbtn";
		ssubmitButtonContainer.appendChild(nnewSubmitButton);
		const showMoreButton = document.createElement("button");
		showMoreButton.type = "button";
		showMoreButton.id = "showmorec";
		showMoreButton.classList.add("btn-primary");
		showMoreButton.textContent = "MaxCard Display +2|+3";
		showMoreButton.onclick = () => showMoreCards();
		// showMoreButton.onclick = showMoreCards;  <-wrongway expects reference not a fn call cuz will send returnvalue to this btn
		// showMoreButton.addEventListener("click", showMoreCards);
		document.getElementById("buttons").appendChild(showMoreButton);
		const txtplusButton = document.createElement("button");
		txtplusButton.type = "button";
		txtplusButton.id = "zplusbtn";
		txtplusButton.classList.add("btn-primary");
		txtplusButton.textContent = "+";
		txtplusButton.onclick = () => counter.incrementFileSwitch();
		document.getElementById("zbtns").appendChild(txtplusButton);
		const txtminusButton = document.createElement("button");
		txtminusButton.type = "button";
		txtminusButton.id = "zminusbtn";
		txtminusButton.classList.add("btn-primary");
		txtminusButton.textContent = "-";
		txtminusButton.onclick = () => counter.decrementFileSwitch();
		document.getElementById("zbtns").appendChild(txtminusButton);
		coco.style.display = "none";
		dbbtn.style.display = "block";
		displ();
		document.getElementById("dbbtn").addEventListener("submit", postsensolData);
	} else if (isIndexDB) {
		console.log("Switching to IndexedDB");
		const submitButtonContainer = document.getElementById("txtbtn");
		const newSubmitButton = document.createElement("button");
		newSubmitButton.textContent = "Add text to indexDB";
		newSubmitButton.type = "submit";
		newSubmitButton.classList.add("btn-primary");
		newSubmitButton.id = "indexdbsubmitbtn";
		submitButtonContainer.appendChild(newSubmitButton);
		const wipeDBButton = document.createElement("button");
		wipeDBButton.textContent = "wipe IndexDB";
		wipeDBButton.type = "button";
		wipeDBButton.id = "wipeDBButton";
		wipeDBButton.setAttribute("onclick", "wipeData()");
		wipeDBButton.classList.add("btn-primary");
		document.getElementById("buttons").appendChild(wipeDBButton);
		coco.style.display = "none";
		txtbtn.style.display = "flex";
		ensureDatabaseConnection();
		document.getElementById("txtbtn").addEventListener("submit", handleSubmit);
	} else if (isSessionDB) {
		console.log("Switching to SessionDB");
		const sessionbtn = document.getElementById("sessionbtn");
		const newsesSubmitButton = document.createElement("button");
		newsesSubmitButton.textContent = "Add text to SessionDB";
		newsesSubmitButton.type = "submit";
		newsesSubmitButton.classList.add("btn-primary");
		newsesSubmitButton.id = "sessiondbsubmitbtn";
		sessionbtn.appendChild(newsesSubmitButton);
		coco.style.display = "none";
		txtbtn.style.display = "none";
		dbbtn.style.display = "none";
		sessionbtn.style.display = "block";
		sessionbtn.addEventListener("submit", handleSessionSubmit);
		sessionbtn.reset();
		window.currentStorageType = "session";
		displaysesCards(); // Add this line to show existing cards on switch

		// sessionStorage.setItem("user", JSON.stringify(user);// Store data
		// let value = JSON.parse(sessionStorage.getItem("user");// Retrieve data
		// sessionStorage.removeItem("key");// Remove data
		// sessionStorage.clear();// Clear all session storage data
	} else if (isLocalDB) {
		console.log("Switching to LocalDB");
		const localbtn = document.getElementById("sessionbtn"); // Reuse the same form for simplicity? Or create a new one? Let's reuse for now.
		const newlocSubmitButton = document.createElement("button");
		newlocSubmitButton.textContent = "Add text to LocalDB";
		newlocSubmitButton.type = "submit";
		newlocSubmitButton.classList.add("btn-primary");
		newlocSubmitButton.id = "localdbsubmitbtn"; // Give it a unique ID if needed
		//localbtn.innerHTML = ""; // Clear previous buttons if reusing form
		localbtn.appendChild(newlocSubmitButton);
		coco.style.display = "none";
		txtbtn.style.display = "none";
		dbbtn.style.display = "none";
		localbtn.style.display = "block"; // Show the form
		localbtn.addEventListener("submit", handleSessionSubmit); // Reuse the same handler
		sessionbtn.reset();
		window.currentStorageType = "local"; // Set storage type
		displaysesCards(); // Display cards from localStorage
	} else if (selectedValue === "cachedb") {
		console.log("Switching to Cache API view");
		// Clear specific UI elements from other modes
		document.getElementById("dbbtn").innerHTML = "";
		document.getElementById("txtbtn").innerHTML = "";
		document.getElementById("sessionbtn").innerHTML = "";
		document.getElementById("buttons").innerHTML = ""; // Clear general buttons area if needed
		// document.getElementById("zbtns").innerHTML = "";

		// Hide forms
		coco.style.display = "none";
		txtbtn.style.display = "none";
		dbbtn.style.display = "none";
		sessionbtn.style.display = "none";

		// Clear card display area
		cardHolder.innerHTML = "<p>Cache API selected. Use DevTools (Application > Cache Storage) to inspect.</p>";

		// Example: Add a button to cache a specific resource
		// const cacheButtonContainer = document.getElementById("buttons"); // Or another suitable container
		const cacheDemoButton = document.createElement("button");
		cacheDemoButton.textContent = "Cache 'sen.txt'";
		cacheDemoButton.type = "button";
		cacheDemoButton.classList.add("btn-primary");
		cacheDemoButton.onclick = async () => {
			const cacheName = "my-cache-v1"; // Same name as in sw.js or a new one
			const cache = await caches.open(cacheName);
			try {
				// Add a try...catch here for better debugging
				await cache.add("/sen.txt"); // <--- This might be failing!
				console.log("'sen.txt' added to cache:", cacheName);
				alert("'sen.txt' added to cache. Check DevTools!");
			} catch (error) {
				console.error("Failed to cache '/sen.txt':", error); // Log the specific error
				alert(`Failed to cache '/sen.txt': ${error.message}`);
			}
		};
		// cacheButtonContainer.appendChild(cacheDemoButton);
		const showCacheButton = document.createElement("button");
		showCacheButton.textContent = "Show Cached sen.txt";
		showCacheButton.onclick = showCachedSenTxt;
		cardHolder.appendChild(showCacheButton);
		cardHolder.appendChild(cacheDemoButton);
	} else if (selectedValue === "socket") {
		console.log("Switching to socket database");
	} else {
		console.log("Invalid database selection");
	}
};
window.switchDatabase = switchDatabase;
async function showCachedSenTxt() {
	const cacheName = "my-cache-v1"; // Or whatever your cache is named
	try {
		const cache = await caches.open(cacheName);
		const response = await cache.match("/sen.txt");
		// const response = await cache.match("http://localhost:8888/sen.txt");
		const displayArea = document.getElementById("cardHolder"); // Or another element

		if (response) {
			const text = await response.text();
			displayArea.innerHTML = `<p>Content of cached /sen.txt:</p><pre>${text}</pre>`;
			console.log("Displayed sen.txt from cache.");
		} else {
			displayArea.innerHTML = "<p>/sen.txt not found in cache.</p>";
			console.log("sen.txt not found in cache.");
		}
	} catch (error) {
		console.error("Error accessing cache:", error);
		document.getElementById("cardHolder").innerHTML = `<p>Error accessing cache: ${error.message}</p>`;
	}
}
const apiEndpoints = {
	"https://db-2-cards.vercel.app": {
		joke: "/api/vercel-proxy?type=joke",
		insult: "/api/vercel-proxy?type=insult",
	},
	"http://localhost:8888": {
		joke: "/.netlify/functions/net-proxy?path=jokes",
		insult: "/.netlify/functions/net-proxy?path=insults",
	},
	"http://localhost:3000": {
		joke: "/api/vercel-proxy?type=joke",
		insult: "/api/vercel-proxy?type=insult",
	},
	"https://elegant-bubblegum-a62895.netlify.app": {
		joke: "/.netlify/functions/net-proxy?path=jokes",
		insult: "/.netlify/functions/net-proxy?path=insults",
	},
};

function getApiUrl(type) {
	const origin = window.location.origin;
	console.log("Current Origin for API lookup:", origin);
	const endpointConfig = apiEndpoints[origin];

	if (endpointConfig && endpointConfig[type]) {
		console.log(`Using endpoint for ${origin} [${type}]: ${endpointConfig[type]}`);
		return endpointConfig[type];
	} else {
		// Fallback if origin or type not found
		const fallbackUrl = `/api/vercel-proxy?type=${type}`; // Defaulting to Vercel proxy
		console.warn(`Origin '${origin}' or type '${type}' not found in apiEndpoints config. Using fallback: ${fallbackUrl}`);
		return fallbackUrl;
	}
}
document.querySelector('button[id="buon"]').addEventListener("click", async () => {
	const apiUrl = getApiUrl("joke");
	const apiiUrl = getApiUrl("insult");
	// const apiUrl = process.env.NODE_ENV === 'development'
	// const proxyUrl = "https://cors-anywhere.herokuapp.com/";
	// const apiUrl = "https://api.adviceslip.com/advice";

	//console.log("Fetching joke from:", apiUrl); // Log the determined URL
	fetch(apiUrl)
		.then((response) => {
			if (!response.ok) throw new Error(`Joke fetch failed: ${response.statusText}`);
			return response.json();
		})
		.then((data) => {
			document.getElementById("adviceid").innerHTML = data.joke || "No joke found (YoMama API)";
		})
		.catch((error) => {
			console.error("Error fetching joke:", error);
			document.getElementById("adviceid").innerHTML = `Error: ${error.message}`;
		});

	// This one doesn't depend on your logic, but keep it if you want it
	fetch("https://icanhazdadjoke.com/", {
		headers: { Accept: "application/json" },
	})
		.then((response) => {
			if (!response.ok) throw new Error(`Dad joke fetch failed: ${response.statusText}`);
			return response.json();
		})
		.then((data) => (document.getElementById("advice").innerHTML = `${data.joke}`))
		.catch((error) => {
			console.error("Error fetching dad joke:", error);
			document.getElementById("advice").innerHTML = `Error: ${error.message}`;
		});

	//console.log("Fetching insult from:", apiiUrl); // Log the determined URL
	fetch(apiiUrl)
		.then((response) => {
			if (!response.ok) throw new Error(`Insult fetch failed: ${response.statusText}`);
			return response.json();
		})
		.then((data) => {
			document.getElementById("insult").innerHTML = data.insult || "No insult found (EvilInsult API)";
		})
		.catch((error) => {
			console.error("Error fetching insult:", error);
			document.getElementById("insult").innerHTML = `Error: ${error.message}`;
		});
});

// const apiUrl = "https://www.yomama-jokes.com/api/v1/jokes/random/";

// insult api doesnt include cors header in their server, cors-anywhere for dev testing., unless u make own server including response with cors header this wont work
// const api_Url = "https://cors-anywhere.herokuapp.com/https://evilinsult.com/generate_insult.php?lang=en&type=json";
