// dotenv
// import dotenv from "./dotenv";
// dotenv.config();
// import "htmx.org";
// import "/initiate-htmx.js";
document.addEventListener("DOMContentLoaded", () => {
	const htmxButton = document.getElementById("htmx-proxy");
	const currentUrl = window.location.origin;

	if (currentUrl.includes("vercel.app")) {
		htmxButton.setAttribute("hx-get", "/api/vercel-proxy?type=image");
	} else if (currentUrl.includes("netlify.app")) {
		htmxButton.setAttribute("hx-get", "/.netlify/functions/net-proxy?path=images");
	} else {
		console.error("Unknown URL, no API endpoint configured.");
	}
});
// import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
document.addEventListener("DOMContentLoaded", () => {
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
	//terms disabled && 1 == 0
	if (!document.cookie.includes("terms-accepted") && 1 == 0) {
		closeDisclaimerModal.addEventListener("click", () => {
			if (acknowledgeDisclaimer.checked) {
				document.cookie = "acpttermsBy= ${terms-accepted}; SameSite=Strict; max-age= " + 60 * 60 * 24 * 30;
				document.body.style.overflow = "auto";
				disc.remove();
			} else {
				body.classList.add("hide");
				document.body.style.overflow = "hidden";
			}
		});
	} else {
		document.body.style.overflow = "auto";
		disc.remove();
	}
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
//   // // formData.append("name", name.value);
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
				return "/api/vercel-proxy?type=image"; // Vercel API endpoint
			} else if (currentUrl === "https://elegant-bubblegum-a62895.netlify.app" || currentUrl === "http://localhost:8888") {
				return "/.netlify/functions/net-proxy?path=images"; // Netlify API endpoint
			} else {
				console.error("Unknown URL, no API endpoint configured.");
				return null;
			}
		};

		const apiUrl = getApiUrl();
		document.getElementById("imgg").setAttribute("src", "Loading...");
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
					console.log("API Response:", response);
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
	}
};
window.switchDatabase = switchDatabase;
document.querySelector('button[id="buon"]').addEventListener("click", async () => {
	// 	const apiUrl = process.env.NODE_ENV === 'development'
	// 	  ? 'http://localhost:8888/api/proxy'  // Netlify Dev
	//   : '/api/proxy';                      // Production

	// const proxyUrl = "https://cors-anywhere.herokuapp.com/";
	// const apiUrl = "https://api.adviceslip.com/advice";

	// "http://localhost:8888/api/proxy";
	// "/.netlify/functions/api/proxxy";
	const apiUrl = "/api/vercel-proxy?type=joke";
	const apiiUrl = "/.netlify/functions/net-proxy?path=insults";

	fetch(apiUrl)
		.then((response) => response.json())
		.then((data) => {
			//   console.log(data);
			document.getElementById("adviceid").innerHTML = data.joke || "No joke found v";
		})
		.catch((error) => console.error("Error:", error));

	fetch("https://icanhazdadjoke.com/", {
		headers: { Accept: "application/json" },
	})
		.then((response) => response.json())
		.then((data) => (document.getElementById("advice").innerHTML = `${data.joke}`))
		.catch((error) => console.error("Error:", error));

	fetch(apiiUrl)
		.then((response) => response.json())
		.then((data) => {
			//	console.log(data);
			document.getElementById("insult").innerHTML = data.insult || "No joke found n";
		})
		.catch((error) => console.error("Error:", error));
});

// document.querySelector('button[id="buon"]').addEventListener("click", async () => {
// const response = await fetch(apiUrl + "?" + Math.floor(Math.random() * 10, {
// 	const response = await fetch(proxyUrl +apiUrl, {
// 		cache: "no-cache",
// 		method: "GET",
// 		headers: {
// 			accept: "application/json",
// 			"Content-Type": "application/json",
// 		},
// 	});
// 		if (response.status != 200) {
// 					document.getElementById("err").style.display = "block";
// 					document.getElementById("span").innerHTML = `${response.status}`;
// 				} else {
// 					var data = await response.json();
// 					document.querySelector("#err").style.display = "none";
// 					console.log("data:" + JSON.stringify(data));
// 					document.getElementById("advice").innerHTML = `${data.joke}`;
// 					 document.getElementById("advice").innerHTML = `${data.slip.advice}`;
// 					 document.getElementById("adviceid").innerHTML = `${data.slip.id}`;
// 				}
//  });
// const apiUrl = "https://www.yomama-jokes.com/api/v1/jokes/random/";

// insult api doesnt include cors header in their server, cors-anywhere for dev testing., unless u make own server including response with cors header this wont work
// const api_Url = "https://cors-anywhere.herokuapp.com/https://evilinsult.com/generate_insult.php?lang=en&type=json";
