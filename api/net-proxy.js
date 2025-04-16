// const express = require("express");
// const cors = require("cors");
// const fetch = require("node-fetch");
// import { Readable } from 'stream';

// const app = express();
// app.use(cors());
const getData = require("./shared-proxy.js");

exports.handler = async (event) => {
	console.log("Netlify function called!");
	const path = event.path.replace("/api/", "");

	// const endpoint = { proxy: "https://www.yomama-jokes.com/api/v1/jokes/random/" };
	// const endpoin = { proxxy: "https://evilinsult.com/generate_insult.php?lang=en&type=json" };
	// const endpoints = { pproxy: "https://picsum.photos/200/300" };

	if (path === "proxy") {
		try {
			// const response = await fetch(endpoint[path]);
			// const data = await response.json();
			const data = await getData("joke");
			return {
				statusCode: 200,
				headers: {
					"Content-Type": "application/json",
					"Access-Control-Allow-Origin": "*",
				},
				body: JSON.stringify(data),
			};
		} catch (error) {
			return {
				statusCode: 500,
				body: JSON.stringify({ error: "Failed fetching data" }),
			};
		}
	} else if (path === "proxxy") {
		try {
			// const response = await fetch(endpoin[path]);
			// const data = await response.json();
			const data = await getData("insult");
			return {
				statusCode: 200,
				headers: {
					"Content-Type": "application/json",
					"Access-Control-Allow-Origin": "*",
				},
				body: JSON.stringify(data),
			};
		} catch (error) {
			return {
				statusCode: 500,
				body: JSON.stringify({ error: "Failed fetching data" }),
			};
		}
	} else if (path === "pproxy") {
		try {
			const { buffer, contentType } = await getData("image");

			return {
				statusCode: 200,
				headers: {
					"Content-Type": contentType,
					"Access-Control-Allow-Origin": "*",
				},
				body: buffer.toString("base64"),
				isBase64Encoded: true,
			};
		} catch (error) {
			return {
				statusCode: 500,
				body: JSON.stringify({ error: "Failed fetching data" }),
			};
		}
	} else {
		return {
			statusCode: 404,
			body: JSON.stringify({ error: "Not found" }),
		};
	}
};

// app.listen(3000, () => console.log("Proxy server running on port 3000"));
