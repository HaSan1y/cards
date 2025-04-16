const getData = require("./shared-proxy.js");

module.exports = async (req, res) => {
	// Example: /api/vercel-proxy?type=joke or /api/vercel-proxy?type=insult or ?type=image
	const { type } = req.query;

	try {
		if (type === "image") {
			const { buffer, contentType } = await getData("image");
			res.setHeader("Content-Type", contentType);
			res.setHeader("Access-Control-Allow-Origin", "*");
			res.status(200).end(buffer);
		} else if (type === "insult") {
			const data = await getData("insult");
			res.setHeader("Access-Control-Allow-Origin", "*");
			res.status(200).json(data);
		} else {
			// Default to joke
			const data = await getData("joke");
			res.setHeader("Access-Control-Allow-Origin", "*");
			res.status(200).json(data);
		}
	} catch (error) {
		res.status(500).json({ error: "Failed fetching data" });
	}
};
// /api/vercel-proxy?type=joke
// /api/vercel-proxy?type=insult
// /api/vercel-proxy?type=image
