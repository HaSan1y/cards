const express = require("express");
const fs = require("fs");
const cors = require("cors");
const app = express();
app.use(cors());
const port = 3000;
// const port = process.env.PORT || 3000;
app.use(express.json());

app.post("/sen", (req, res) => {
	if (!Array.isArray(req.body) || req.body.length === 0) {
		return res.status(400).send("Invalid input: Expected non-empty array");
	}
	let sentenceText = "";
	for (let i = 0; i < req.body.length; i++) {
		sentenceText += req.body[i] + "\n";
	}
	// fs.writeFile
	fs.appendFile("sen.txt", sentenceText, "utf8", function (error) {
		if (error) {
			console.error("Error writing to sen.txt:", error);
			res.status(500).send("Error writing to sen.txt");
		} else {
			res.send("Sentences data written to sen.txt successfully");
		}
	});
});

app.post("/sol", (req, res) => {
	let solutionText = "";
	for (let i = 0; i < req.body.length; i++) {
		solutionText += req.body[i] + "\n";
	}
	fs.appendFile("sol.txt", solutionText, "utf8", function (error) {
		if (error) {
			console.error("Error writing to sol.txt:", error);
			res.status(500).send("Error writing to sol.txt");
		} else {
			res.send("Solution data written to sol.txt successfully");
		}
	});
});

app.listen(port, () => console.log(`Server listening at ${port}`));
// del lines
// function deleteLines(filePath, linesToDelete) {
//    const fileContents = fs.readFileSync(filePath, 'utf8');
//    const lines = fileContents.split('\n');
//    for (let i = linesToDelete.length - 1; i >= 0; i--) {
//      lines.splice(linesToDelete[i], 1);
//    }
//    const newContents = lines.join('\n');
//    fs.writeFileSync(filePath, newContents, 'utf8');
//  }
//  xxx.addEventListener('click', () => { deleteLines('sen.txt', [0, 1, 2]); })
