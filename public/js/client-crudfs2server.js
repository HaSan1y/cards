// import fetch from "node-fetch";  this file becomes independent if implemented

const cards = document.querySelectorAll("#card");
// if (typeof cards === "undefined") {}
// improvements: css, global, errorreports, postgresql/expressjs/koa.js, separate codeblocks, comments, react, tests, nosql.. client login+CRUD,
class Counter {
	constructor() {
		this.switchedFiles = 0;
		this.totalCards = 0;
		this.maxCardsOverflow = 6;
		this.howoftenOverflowed = 0;
		this.sentences = [];
		this.solution = [];
	}
	incrementFileSwitch() {
		const y = document.querySelectorAll(".myCard");
		if (y.length > 0) {
			y.forEach((xy) => xy.remove());
		} else {
			console.warn("No elements to remove found.");
		}
		this.maxCardsOverflow = 6;
		this.howoftenOverflowed = 0;
		this.switchedFiles++;
		console.log(counter.switchedFiles);
		this.totalCards = 0;
		this.sentences = [];
		this.solution = [];
		displ();
		if (counter.switchedFiles === 0) {
			document.getElementById("showmorec").style.display = "block";
		}
		document.getElementById("zminusbtn").textContent = "-" + counter.switchedFiles.toString();
	}
	decrementFileSwitch() {
		const y = document.querySelectorAll(".myCard");
		if (y.length > 0) {
			y.forEach((xy) => xy.remove());
		} else {
			console.warn("No elements to remove found.");
		}
		this.maxCardsOverflow = 6;
		this.howoftenOverflowed = 0;
		if (counter.switchedFiles > 0) {
			this.switchedFiles--;
		}
		console.log(counter.switchedFiles);
		this.totalCards = 0;
		this.sentences = [];
		this.solution = [];
		displ();
		if (counter.switchedFiles === 0) {
			document.getElementById("showmorec").style.display = "block";
		}
		document.getElementById("zminusbtn").textContent = "- " + counter.switchedFiles.toString();
	}
	incrementmax() {
		this.maxCardsOverflow += 3;
	}
}
const counter = new Counter();

async function fetchFile(filePath) {
	try {
		const response = await fetch(filePath);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		return await response.text();
	} catch (error) {
		console.error(`Error reading file: ${filePath}`, error);
		return null;
	}
}
async function getsensolData() {
	try {
		const filePath = counter.switchedFiles === 0 ? "sen.txt" : counter.switchedFiles === 1 ? `sen${counter.switchedFiles}.txt` : "sen.txt";
		const solFilePath = counter.switchedFiles === 0 ? "sol.txt" : counter.switchedFiles === 1 ? `sol${counter.switchedFiles}.txt` : "sol.txt";
		console.log(filePath, solFilePath);
		// const filePath = "sen.txt";
		// const solFilePath = "sol.txt";
		const [data, solData] = await Promise.all([fetchFile(filePath), fetchFile(solFilePath)]);
		if (!data || !solData) {
			return null;
		}
		const sentences = data.trim().split("\n");
		const solution = solData.trim().split("\n");
		return { sentences, solution };
	} catch (error) {
		console.error("Error reading file:", error);
	}
}
async function displ() {
	const result = await getsensolData();
	if (result) {
		const { sentences, solution } = result;

		let x = counter.maxCardsOverflow <= 6 ? 0 : counter.maxCardsOverflow + 3 * counter.howoftenOverflowed;
		let solindex = counter.maxCardsOverflow <= 6 ? 0 : counter.maxCardsOverflow - 3;
		// let startIndex = counter.totalCards;

		for (let i = x; i < sentences.length && counter.totalCards < counter.maxCardsOverflow; i++) {
			const card = document.createElement("div");
			card.classList.add("myCard");

			card.id = `card-${i}`;
			// card.id = `card-${startIndex + counter.totalCards}`;

			const heading = document.createElement("h2");
			heading.classList.add("title");
			heading.textContent = sentences[i];

			const backSide = document.createElement("h2");
			if (solindex < solution.length) {
				backSide.textContent = solution[solindex];
			} else {
				backSide.textContent = "No solution available.";
			}

			const paragraph = document.createElement("p");
			if (i + 1 < sentences.length) {
				paragraph.textContent = sentences[i + 1];
			} else {
				paragraph.textContent = "No additional content.";
			}
			i++;
			solindex++;

			// card.addEventListener("click", () => {
			// 	toggleCardContent(card, sentences);
			// }); card eventlistener  interfering with indexdbjs
			const deleteButton = document.createElement("button");
			deleteButton.textContent = "Delete";
			deleteButton.classList.add("removebtn");
			const innerCard = document.createElement("div");
			innerCard.classList.add("innerCard");
			const frontSide = document.createElement("div");
			frontSide.classList.add("frontSide");
			backSide.classList.add("backSide");

			innerCard.appendChild(frontSide);
			innerCard.appendChild(backSide);
			frontSide.appendChild(heading);
			frontSide.appendChild(paragraph);
			backSide.appendChild(deleteButton);
			card.appendChild(innerCard);
			cardHolder.appendChild(card);

			deleteButton.onclick = (e) => {
				e.stopPropagation();
				card.remove();
				console.log("Card deleted");
			};
			counter.totalCards++;
		}
	}
}

async function toggleCardContent(card, sentences) {
	const heading = card.querySelector("h2");
	const paragraph = card.querySelector("p");
	const cardIndex = parseInt(card.id.split("-")[1]);
	heading.textContent = sentences[cardIndex];
	if (cardIndex < sentences.length) {
		try {
			if (counter.switchedFiles > 0) {
				const response = await fetch(`sol${counter.switchedFiles}.txt`);
			} else {
				const response = await fetch("sol.txt");
			}

			const data = await response.text();
			const solution = data.trim().split("\n");
			if (cardIndex > 0) {
				let x = Math.floor(cardIndex / 2);
				paragraph.textContent = `${x} ` + solution[x];
			} else {
				paragraph.textContent = solution[cardIndex] + `${cardIndex}`;
			}
		} catch (error) {
			console.error("Error reading file:", error);
		}
	} else {
		paragraph.textContent = "";
	}
}

//triggered via btn created on top
async function showMoreCards() {
	const result = await getsensolData();
	if (result) {
		const { sentences, solution } = result;
		counter.totalCards = document.querySelectorAll(".myCard").length;
		counter.howoftenOverflowed += 1;
		counter.incrementmax() * counter.howoftenOverflowed;
		let cardsToShow = counter.totalCards + counter.maxCardsOverflow;
		if (cardsToShow >= sentences.length) {
			document.getElementById("showmorec").style.display = "none";
			return;
		} else {
			document.getElementById("showmorec").style.display = "block";
		}
		displ();
		document
			.getElementById("showmorec")
			.setAttribute("data-content", `(${solution.length.toString()}) CardsOnServer | displayingCards  (${counter.totalCards.toString()}/${cardsToShow.toString()})`);
	}
}

function remove() {
	// remove all cards except first 6
	const cards = document.querySelectorAll(".myCard");
	for (let i = cards.length - 1; i >= cards.length - counter.maxCardsOverflow + 6 && i >= 0 && counter.maxCardsOverflow > i; i--) {
		cards[i].remove();
		counter.maxCardsOverflow--;
		counter.howoftenOverflowed = 0;
		counter.totalCards--;
	}
	const y = document.querySelectorAll(".myCard");
	if (y.length > 0) {
		cards.forEach((xy) => xy.remove());
	} else {
		console.warn("No elements with to remove found.");
	}
}

async function postsensolData(event) {
	event.preventDefault();
	const t1 = document.getElementById("t1").value;
	const t2 = document.getElementById("t2").value;
	const solution = document.getElementById("t3").value;

	// const senResponse = await postData("http://127.0.0.1:3000/sen", [{ t1, t2 }]);
	const filePath = counter.switchedFiles === 0 ? "sen.txt" : counter.switchedFiles === 1 ? `sen${counter.switchedFiles}.txt` : "sen.txt";
	// const solFilePath = counter.switchedFiles === 0 ? "sol.txt" : counter.switchedFiles === 1 ? `sol${counter.switchedFiles}.txt` : "sol.txt";

	const xhrSen = new XMLHttpRequest();
	// cors issue:
	// to make it work locally-> make the request from url http://localhost:5500/public/
	// also run the server (with right click, run) server-crudfs2client.js   ->:3000
	// http://127.0.0.1:* is ur running server not ur url, also del cookies i guess
	xhrSen.open("POST", `http://127.0.0.1:3000/${filePath}`, true); // unwork on vercel do db there
	xhrSen.setRequestHeader("Content-Type", "application/json");
	const data = {
		t1: t1,
		t2: t2,
		solution,
		switchedFiles: counter.switchedFiles,
	};
	// const data = [t1, t2, solution, counter.switchedFiles];
	xhrSen.send(JSON.stringify(data));

	xhrSen.onload = function () {
		console.log(`Sentences data written to ${filePath} successfully`);
	};

	xhrSen.onerror = function () {
		console.error(`Error writing to ${filePath}:`, xhrSen.status);
	};

	// Fetch sol.txt
	// const xhrSol = new XMLHttpRequest();
	// xhrSol.open("POST", `http://127.0.0.1:3000/${solFilePath}`, true);
	// xhrSol.setRequestHeader("Content-Type", "application/json");
	// xhrSol.send(JSON.stringify(solution));

	// xhrSol.onload = function () {
	// 	console.log(`Solution data written to ${solFilePath} successfully`);
	// };

	// xhrSol.onerror = function () {
	// 	console.error(`Error writing to ${solFilePath}:`, xhrSol.status);
	// };
	// try {
	// 	const response = await fetch(`http://127.0.0.1:3000/${filePath}`, {
	// 		method: "POST",
	// 		headers: { "Content-Type": "application/json" },
	// 		// body: JSON.stringify(sentences),
	// 		body: JSON.stringify([t1, t2]), // Send an array of strings
	// 	});
	// 	const data = await response.text();
	// 	console.log(data);

	// 	const solResponse = await fetch(`http://127.0.0.1:3000/${solFilePath}`, {
	// 		method: "POST",
	// 		headers: { "Content-Type": "application/json" },
	// 		body: JSON.stringify(solution),
	// 		// { solution: solution }
	// 	});
	// 	const solData = await solResponse.text();
	// 	console.log(solData);
	// } catch (error) {
	// 	console.error("Error writing to files:", error);
	// }
}
