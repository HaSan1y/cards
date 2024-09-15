let x = "thinkerbella";
let player;
var options = {
	width: 500,
	height: 500,
	channel: x,
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
