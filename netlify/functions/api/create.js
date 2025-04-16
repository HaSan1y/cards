const express = require("express");
const cors = require("cors");
const app = express();
const port = 3000;

app.use(cors());
// app.use(cors({
//   origin: [
//     'http://localhost:8888',
//     'https://your-netlify-site.netlify.app'
//   ],
//   credentials: true
// }));
app.use(express.json());

// Create API endpoints
app.post("/create", (req, res) => {
	console.log("Received data:", req.body);
	res.json({ message: "Data received successfully!", data: req.body });
});

app.get("/read", (req, res) => {
	readRecords()
		.then((data) => res.json(data))
		.catch((error) => res.status(500).json({ error: "Failed to read records" }));
});

app.put("/update", (req, res) => {
	updateRecord(req.body)
		.then((data) => res.json(data))
		.catch((error) => res.status(500).json({ error: "Failed to update record" }));
});

app.delete("/delete", (req, res) => {
	deleteRecord(req.body)
		.then((data) => res.json(data))
		.catch((error) => res.status(500).json({ error: "Failed to delete record" }));
});

// Start server
app.listen(port, () => {
	console.log(`Server started on port http://localhost:${port}`);
});
