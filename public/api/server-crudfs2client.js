const express = require("express");
const fs = require("fs");
const cors = require("cors");
const app = express();
const ports = process.env.PORT || 3000;

app.use(
	cors({
		origin: "*", // origin: "http://127.0.0.1:5500", // allow requests from this origin
		//,	methods: ["GET", "POST", "PUT", "DELETE"], // allow these methods
		//	allowedHeaders: ["Content-Type", "Authorization"], // allow these headers
		// maxAge: 3600, // cache CORS configuration for 1 hour

		// cors issue:
		// to make it work-> make the request from url http://localhost:5500/public/
		// and run the server with right click on the file server-crudfs2client.js
	}),
);
app.use(express.json());
app.post("/:fileType", (req, res) => {
	try {
		// res.header("Access-Control-Allow-Origin", "*");
		// res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
		// res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
		// res.header("Access-Control-Allow-Credentials", "true");
		// res.header("Access-Control-Max-Age", "3600"); // cache CORS configuration for 1 hour
		const fileType = req.params.fileType.split(".")[0];
		const { switchedFiles, t1, t2, solution } = req.body;
		// const [t1, t2, solution, switchedFiles] = req.body;
		// const filePath = `${fileType}${switchedFiles > 0 ? switchedFiles : ""}.txt`;
		// const switchedFiles = req.query.switchedFiles; 3000/${filePath}?switchedFiles=${counter.switchedFiles}`, true);

		if (![`sen${switchedFiles > 0 ? switchedFiles : ""}`, `sol${switchedFiles > 0 ? switchedFiles : ""}`].includes(fileType)) {
			// if (!["sen", "sol", `sen$`, "sol1"].includes(fileType)) {
			return res.status(400).send(`Invalid file type: ${fileType}`);
		}
		if (typeof req.body !== "object" || Object.keys(req.body).length === 0) {
			// if (!Array.isArray(req.body) || req.body.length === 0) {
			return res.status(400).send("Invalid input: Expected non-empty object");
		}
		let sentenceContent = "";
		let solutionContent = "";
		switch (fileType) {
			case `sen${switchedFiles > 0 ? switchedFiles : ""}`:
				// case "sen*":
				sentenceContent = `${t1}\n${t2}\n`;
				solutionContent = `${solution}\n`;
				break;
			case `sol${switchedFiles > 0 ? switchedFiles : ""}`:
				// case "sol*":
				solutionContent = `${solution}\n`;
				break;
		}
		const sentenceFilePath = `./public/${fileType}.txt`;
		const solutionFilePath = `./public/sol${fileType === "sen1" ? "1" : ""}.txt`;

		const writeToFile = (filePath, content) => {
			return new Promise((resolve, reject) => {
				fs.appendFile(filePath, content, "utf8", (error) => {
					if (error) {
						console.error(`Error writing to ${filePath}:`, error);
						reject(error);
					} else {
						console.log(`Data written to ${filePath} successfully`);
						resolve();
					}
				});
			});
		};

		// Write to files
		// Promise.all([sentenceContent && writeToFile(sentenceFilePath, sentenceContent), solutionContent && writeToFile(solutionFilePath, solutionContent)])
		const promises = [];
		if (sentenceContent) promises.push(writeToFile(sentenceFilePath, sentenceContent));
		if (solutionContent) promises.push(writeToFile(solutionFilePath, solutionContent));
		Promise.all(promises)
			.then(() => {
				res.send(`Data written to files successfully`);
			})
			.catch((error) => {
				res.status(500).send(`Error writing to files: ${error}`);
			});
		// fs.writeFile
	} catch (error) {
		console.error("Error processing request:", error);
		res.status(500).send("Internal server errorr");
	}
});
// app.get('/sol.txt', (req, res) => {
// 	res.header('Access-Control-Allow-Origin', 'http://127.0.0.1:5500');
// 	res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
// 	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
// 	res.send('Inhalt von sol.txt');
//  });
// app.post("/sol", (req, res) => {
// 	let solutionText = "";
// 	for (let i = 0; i < req.body.length; i++) {
// 		solutionText += req.body[i] + "\n";
// 	}
// 	fs.appendFile("sol.txt", solutionText, "utf8", function (error) {
// 		if (error) {
// 			console.error("Error writing to sol.txt:", error);
// 			res.status(500).send("Error writing to sol.txt");
// 		} else {
// 			res.send("Solution data written to sol.txt successfully");
// 		}
// 	});
// });

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

//  function addTextToFile() {
//    var text = document.getElementById('t1').value;
//    var blob = new Blob([text], { type: "text/plain;charset=utf-8" });
//    var link = document.createElement("a");
//    var url = URL.createObjectURL(blob);
//    link.setAttribute("href", url);
//    link.setAttribute("download", "file.txt");
//    link.style.visibility = 'hidden';
//    document.body.appendChild(link);
//    link.click();
//    document.body.removeChild(link);
//  }
app.listen(ports, () => console.log(`Server listening at ${ports}`));
