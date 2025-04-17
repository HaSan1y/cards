const getData = require("./shared-proxy.js");

export default async function handler(req, res) {
	console.log("Vercel function called!");
	// Example: /api/vercel-proxy?type=joke or /api/vercel-proxy?type=insult or ?type=image
	const { type } = req.query;

	try {
		if (type === "image") {
			const { buffer, contentType } = await getData("image");
			res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
			res.setHeader("Access-Control-Allow-Headers", "Content-Type");
			res.setHeader("Content-Type", contentType);
			res.setHeader("Access-Control-Allow-Origin", "*");
			res.status(200).end(buffer);
		} else if (type === "insult") {
			const data = await getData("insult");
			res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
			res.setHeader("Access-Control-Allow-Headers", "Content-Type");
			res.setHeader("Access-Control-Allow-Origin", "*");
			res.status(200).json(data);
		} else if (type === "joke") {
			const data = await getData("joke");
			res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
			res.setHeader("Access-Control-Allow-Headers", "Content-Type");
			res.setHeader("Access-Control-Allow-Origin", "*");
			res.status(200).json(data);
		} else {
			console.error("Invalid type:", type);
			res.status(400).json({ error: "Invalid type" });
		}
	} catch (error) {
		console.error("Error fetching data:", error);
		res.status(500).json({ error: "Failed fetching data" });
	}
}
// /api/vercel-proxy?type=joke
// /api/vercel-proxy?type=insult
// /api/vercel-proxy?type=image
