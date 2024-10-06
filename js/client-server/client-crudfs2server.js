// if (!isIDB) {
const cards = document.querySelectorAll("#card");
// if (typeof cards === "undefined") {}
// improvements: global, errorreports, postgresql/expressjs/koa.js, separate codeblocks, comments,react,tests
class Counter {
	constructor() {
		this.switchedFiles = 0;
		this.totalCards = 0;
		this.maxCardsOverflow = 6;
		this.howoftenOverflowed = 0;
		this.sentences = [];
		this.solution = [];
	}
	increment() {
		this.switchedFiles++;
	}
	incrementmax() {
		this.maxCardsOverflow += 3;
		// todo apparently i dont know math
	}
}
const counter = new Counter();
// let sentences = [];
// let solution = [];

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
		// const filePath = counter.switchedFiles === 0 ? "sen.txt" : `sen${counter.switchedFiles}.txt`;
		const filePath = "sen.txt";
		const solFilePath = "sol.txt";
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
			// const uniqueCardId = `card-${startIndex + counter.totalCards}`;
			// card.id = uniqueCardId;

			const heading = document.createElement("h2");
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
			deleteButton.classList.add("delete-button");
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
			const response = await fetch("sol.txt");
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

//triggered via btn created on top
async function showMoreCards() {
	console.log("test");
	const result = await getsensolData();
	if (result) {
		const { sentences, solution } = result;
		console.log(sentences, solution);
		counter.totalCards = document.querySelectorAll(".myCard").length;
		counter.howoftenOverflowed += 1;
		counter.incrementmax() * counter.howoftenOverflowed;
		let cardsToShow = counter.totalCards + counter.maxCardsOverflow;
		if (cardsToShow >= sentences.length) {
			document.getElementById("showmorec").style.display = "none";
			return;
		}
		displ();
	}
}

function remove() {
	// remove all cards except first 6
	for (let i = cards.length - 1; i >= cards.length - this.maxCardsOverflow + 6 && i >= 0; i--) {
		if (this.maxCardsOverflow > i) {
			cards[i].remove();
			this.maxCardsOverflow--;
			counter.howoftenOverflowed = 0;
		}
	}
}

async function postsensolData(event) {
	event.preventDefault();
	const t1 = document.getElementById("t1").value;
	const t2 = document.getElementById("t2").value;
	const solution = document.getElementById("t3").value;

	// const senResponse = await postData("http://127.0.0.1:3000/sen", [{ t1, t2 }]);
	// const solResponse = await postData("http://127.0.0.1:3000/sol", [solution]);
	// const data = {
	// 	sentences: [t1, t2],
	// 	solution: solution,
	// };if json

	fetch("http://127.0.0.1:3000/sen", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		// body: JSON.stringify(sentences),
		body: JSON.stringify([t1, t2]), // Send an array of strings
	})
		.then((response) => response.text())
		.then((data) => console.log(data))
		.catch((error) => console.error("Error writing to sen.txt:", error));
	fetch("http://127.0.0.1:3000/sol", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify([solution]),
		// { solution: solution }
	})
		.then((response) => response.text())
		.then((data) => console.log(data))
		.catch((error) => console.error("Error writing to sol.txt:", error));
}
// }
displ();
