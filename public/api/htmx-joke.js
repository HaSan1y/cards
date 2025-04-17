const fetch = require("node-fetch");
module.exports = async (req, res) => {
	const response = await fetch("https://icanhazdadjoke.com/", {
		headers: { Accept: "text/plain" },
	});
	const joke = await response.text();
	res.status(200).send(joke);
};
