let x = "shonzo";
let player;
var options = {
	width: 400,
	height: 200,
	channel: x,
	quality: "160p",
	//  video: "<video ID>",
	//  collection: "<collection ID>",
	// only needed if your site is also embedded on embed.example.com and othersite.example.com
	//  parent: ["embed.example.com", "othersite.example.com"]
};
player = new Twitch.Player("twitch-embed", options);

function xx() {
	let buttonElement = document.getElementById("buttonx");
	x = buttonElement.value;
	// if btnelement .textContent
	player.setChannel(x);
}

document.getElementById("buttonx").addEventListener("change", function (event) {
	// event.preventDefault();  if submitbtn is in a form
	xx();
});

/// on hover theme switch////////////////////////////////////////////////////////////////////////////////////////
const colorOptions = document.querySelectorAll(".color-option");

colorOptions.forEach((option) => {
	option.addEventListener("mouseover", () => {
		const radioInput = option.querySelector('input[type="radio"]');
		radioInput.checked = true;
	});
});

// update twitch channel name
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
		case "c":
			buttonx.value = "trumporkamala2024";
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
	}

	// Optionally, update the Twitch player here
	player.setChannel(buttonx.value);
}

// Add event listeners to all radio buttons
document.querySelectorAll('input[name="hopping"]').forEach((radio) => {
	radio.addEventListener("change", updateChannelName);
});

// Initial call to set the correct value based on the default checked radio
updateChannelName();
