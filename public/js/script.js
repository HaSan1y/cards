const cookieBox = document.querySelector(".wrapper");
const buttons = document.querySelectorAll(".button");
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
function filterme(value) {
	value = parseInt(value, 10); // Convert to an integer
	var customToggle = document.getElementById("custom-toggle");
	var spanElements = document.querySelectorAll("span");

	if (value === 1) {
		customToggle.classList.remove("tgl-off", "tgl-def");
		customToggle.classList.add("tgl-on");
		spanElements.forEach(function (span) {
			span.textContent = "Enabled";
		});
	} else if (value === 2) {
		customToggle.classList.remove("tgl-on", "tgl-off");
		customToggle.classList.add("tgl-def");
		spanElements.forEach(function (span) {
			span.textContent = "Undetermined";
		});
	} else if (value === 3) {
		customToggle.classList.remove("tgl-def", "tgl-on");
		customToggle.classList.add("tgl-off");
		spanElements.forEach(function (span) {
			span.textContent = "Disabled";
		});
	}
}

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
function switchDatabase() {
	var select = document.getElementById("selectswitchdb");
	var selectedValue = select.value;
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
		// submitButtonContainer.id = "isaform";
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
		dboptionswitcher.style.display = "none";
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
		// submitButtonContainer.id = "dbbtn";
		const wipeDBButton = document.createElement("button");
		wipeDBButton.textContent = "wipe IndexDB";
		wipeDBButton.type = "button";
		wipeDBButton.id = "wipeDBButton";
		wipeDBButton.setAttribute("onclick", "wipeData()");
		wipeDBButton.classList.add("btn-primary");
		document.getElementById("buttons").appendChild(wipeDBButton);
		dboptionswitcher.style.display = "none";
		txtbtn.style.display = "flex";
		ensureDatabaseConnection();
		document.getElementById("txtbtn").addEventListener("submit", handleSubmit);
	}
}

// advise api
document.querySelector('button[id="buon"]').addEventListener("click", async () => {
	const response = await fetch(apiUrl + "?" + Math.floor(Math.random() * 10));
	if (response.status != 200) {
		document.getElementById("err").style.display = "block";
		document.getElementById("span").innerHTML = `${response.status}`;
	} else {
		var data = await response.json();
		document.querySelector("#err").style.display = "none";
		document.getElementById("advice").innerHTML = `${data.slip.advice}`;
		document.getElementById("adviceid").innerHTML = `${data.slip.id}`;
	}
});
const apiUrl = "https://api.adviceslip.com/advice";

checkbox.addEventListener("change", () => {
	if (checkbox.checked && document.getElementById("twitch-embed")) {
		const twitchEmbed = document.getElementById("twitch-embed").remove();
		twitchEmbed.remove();
		// 		const script = document.querySelector('script[src^="https://embed.twitch.tv"]');
		// 		if (script) {
		// 			script.src = script.src.replace(/\/embed\.js$/, "/embed.js");
		// 		}
	} else {
		const twitchEmbed = document.createElement("div");
		twitchEmbed.id = "twitch-embed";
		document.getElementById("tw").appendChild(twitchEmbed);
		// todo: after reembeding, switching channels via btn/input will no longer work.
		var embed = new Twitch.Embed("twitch-embed", {
			width: 480,
			height: 270,
			theme: "dark",
			// channel: "onyxtao",
			channel: "trumporkamala2024",
			layout: "video",
			autoplay: true,
			muted: true,
			parent: ["yourdomain.com"],
		});
	}
});