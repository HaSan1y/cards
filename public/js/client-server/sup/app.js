const express = require("express");
const app = express();
const port = 3000;

// Import CRUD functions
const createRecord = require("./create");
const readRecords = require("./read");
const updateRecord = require("./update");
const deleteRecord = require("./delete");

// Create API endpoints
app.post("/create", (req, res) => {
	createRecord(req.body)
		.then((data) => res.json(data))
		.catch((error) => res.status(500).json({ error: "Failed to create record" }));
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
	console.log(`Server started on port ${port}`);
});
