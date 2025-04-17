const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
// import { Readable } from 'stream';

const app = express();
app.use(cors());
//module.exports = (req, res) => { ... }     w   vercel node
// module.exports = async function getJoke() {

// api/server.js (for Vercel)   res.json({ message: "Vercel works!" });
app.get("/proxy", async (req, res) => {
	const apiUrl = "https://www.yomama-jokes.com/api/v1/jokes/random/";
	try {
		const response = await fetch(apiUrl);
		const data = await response.json();
		return res.json(data);
	} catch (error) {
		res.status(500).send("Error fetching data");
	}
});

app.get("/proxxy", async (req, res) => {
	const apiUrl = "https://evilinsult.com/generate_insult.php?lang=en&type=json";
	try {
		const response = await fetch(apiUrl);
		const data = await response.json();
		return res.json(data);
	} catch (error) {
		res.status(500).send("Error fetching datax");
	}
});

// app.get("/pproxy", async (req, res) => {
//     const apiUrl = "https://picsum.photos/200/300";
//     // const apiUrl = "https://placekitten.com/200/300";
//     try {
//         const response = await fetch(apiUrl).then((res) => {
//             if (!res.ok) {
//                 throw new Error(`HTTP error! status: ${res.status}`);
//             }
//             return res;
//         });
//         if (!response.ok) {
//             console.log("API Error:", await response.text());
//             throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
//         }
//         const nodeStream = Readable.fromWeb(response.body);
//         // Forward headers (optional but recommended)
//         res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg');

//         if (contentType) {
//             res.set('Content-Type', contentType);
//         }

//         nodeStream.pipe(res);

//         nodeStream.on('error', (err) => {
//         console.error('Stream error:', err);
//         if (!res.headersSent) {
//             res.status(500).send('Stream error');
//         }
//     });
//     } catch (error) {
//         console.error("Error fetching image:", error);
//         // res.status(500).send("Error fetching data"+ error.message);
//         if (!res.headersSent) {
//             res.status(500).send("Error fetjching image: " + error.message);
//         }
//     }
// });

app.listen(3000, () => console.log("Proxy server running on port 3000"));
