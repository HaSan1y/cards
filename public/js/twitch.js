let player;

function loadScript(src, callback) {
	let script = document.createElement("script");
	script.src = src;
	script.onload = callback;
	document.head.appendChild(script);
}

loadScript("https://player.twitch.tv/js/embed/v1.js", function () {
	let x = "trumporbiden2028";
	var options = {
		width: 400,
		height: 200,
		channel: x,
		quality: "160p",
	};

	if (typeof Twitch !== "undefined") {
		initPlayer();
	} else {
		console.error("Twitch API not loaded");
		document.addEventListener("DOMContentLoaded", initPlayer);
	}

	function initPlayer() {
		player = new Twitch.Player("twitch-embed", options);
		setupEventListeners();
		updateChannelName(); // Initial call to set the correct value
	}

	function setupEventListeners() {
		document.getElementById("buttonx").addEventListener("change", xx);
		document.querySelectorAll('input[name="hopping"]').forEach((radio) => {
			radio.addEventListener("change", updateChannelName);
		});
	}

	function xx() {
		let buttonElement = document.getElementById("buttonx");
		x = buttonElement.value;
		setChannel(x);
	}

	function setChannel(channel) {
		try {
			player.setChannel(channel);
		} catch (error) {
			console.error("Error setting channel:", error);
		}
	}

	function updateChannelName() {
		const buttonx = document.getElementById("buttonx");
		const selectedRadio = document.querySelector('input[name="hopping"]:checked');

		switch (selectedRadio.value) {
			case "a":
				buttonx.value = "cerbervt";
				break;
			case "b":
				buttonx.value = "plush";
				break;
			case "tb":
				buttonx.value = "thinkerbella";
				break;
			case "w":
				buttonx.value = "spwooqi";
				break;
			case "s":
				buttonx.value = "shonzo";
				break;
			case "c":
				buttonx.value = "trumporbiden2028";
				break;
		}

		setChannel(buttonx.value);
	}
});
