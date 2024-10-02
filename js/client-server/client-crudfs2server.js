const cards = document.querySelectorAll("#card");
// if (typeof cards === "undefined") {
// } else {
// 	cards = document.querySelectorAll("#card");
// }
// class Counter {
// 	constructor() {
// 		this.z = 0;
// 	}

// 	increment() {
// 		this.z++;
// 	}
// }

// const counter = new Counter();
let kek = 8;
let sentences = [];
let totalCards = 0;
let showmore = 8; // Initial number of cards to display

async function display() {
	try {
		// const filePath = counter.z === 0 ? "sen.txt" : `sen${counter.z}.txt`;
		const filePath = "sen.txt";
		const response = await fetch(filePath);
		if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
		const data = await response.text();
		sentences = data.trim().split("\n");

		const showMoreButton = document.createElement("button");
		showMoreButton.textContent = "Show More";
		showMoreButton.setAttribute("id", "showmore");
		showMoreButton.classList.add("btn-primary");
		showMoreButton.addEventListener("click", () => {
			showMoreCards(showMoreButton, sentences, showmore);
		});
		for (let i = 0; i < sentences.length && totalCards < showmore; i++) {
			const card = document.createElement("div");
			card.classList.add("myCard");
			card.id = `card-${i}`;

			const heading = document.createElement("h2");
			heading.textContent = sentences[i];
			const paragraph = document.createElement("p");
			if (i + 1 < sentences.length) {
				paragraph.textContent = i + 1 < sentences.length ? sentences[i + 1] : "No additional content.";
				i++;
			}
			card.addEventListener("click", () => {
				toggleCardContent(card, sentences);
			});

			const deleteButton = document.createElement("button");
			deleteButton.textContent = "Delete";
			deleteButton.classList.add("delete-button");
			const innerCard = document.createElement("div");
			innerCard.classList.add("innerCard");
			const frontSide = document.createElement("div");
			frontSide.classList.add("frontSide");
			const backSide = document.createElement("div");
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
			totalCards++;
		}
		// show.appendChild(showMoreButton);
	} catch (error) {
		console.error("Error reading file:", error);
	}
}

async function toggleCardContent(card, sentences) {
	const heading = card.querySelector("h2");
	const paragraph = card.querySelector("p");
	// const paragraph = card.firstElementChild.firstElementChild;

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

document.getElementById("txtbtn").addEventListener("submit", async (event) => {
	event.preventDefault();

	const t1 = document.getElementById("t1").value;
	const t2 = document.getElementById("t2").value;
	const solution = document.getElementById("t3").value;
	await postData("http://127.0.0.1:3000/sen", [t1, t2]);
	await postData("http://127.0.0.1:3000/sol", [solution]);
	// const sentences = [t1, t2];
	// const solution = [solution];
});

// fetch("http://127.0.0.1:3000/sen", {
// 	method: "POST",
// 	headers: { "Content-Type": "application/json" },
// 	body: JSON.stringify(sentences),
// })
// 	.then((response) => response.text())
// 	.then((data) => console.log(data))
// 	.catch((error) => console.error("Error writing to sen.txt:", error));
// fetch("http://127.0.0.1:3000/sol", {
// 	method: "POST",
// 	headers: { "Content-Type": "application/json" },
// 	body: JSON.stringify(solution),
// })
// 	.then((response) => response.text())
// 	.then((data) => console.log(data))
// 	.catch((error) => console.error("Error writing to sol.txt:", error));
async function postData(url, data) {
	try {
		const response = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const result = await response.text();
	} catch (error) {
		console.error(`Error posting data to ${url}:`, error);
	}
}
//////////////////////////////////////////////////////////////////////////////////////////
//update sen.txt + sol.txt        blob-clientside-app
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
//////////////////////////////////////////////////////////////////////////////////////////
function showMoreCards(button, sentences, showmore) {
	let totalCards = document.querySelectorAll(".card").length + kek;
	kek += 8;
	let cardsToShow = totalCards + showmore * 2;
	for (let i = totalCards; i < cardsToShow && i < sentences.length; i++) {
		const card = document.createElement("div");
		card.classList.add("card", "bi", "bi-hand-index-fill");
		card.id = `card-${i}`;

		const heading = document.createElement("h2");
		heading.textContent = sentences[i];

		const paragraph = document.createElement("p");
		if (i + 1 < sentences.length) {
			paragraph.textContent = sentences[i + 1];
			i++;
		}
		card.addEventListener("click", () => {
			toggleCardContent(card, sentences);
		});
		card.appendChild(heading);
		card.appendChild(paragraph);
		cardHolder.appendChild(card);
	}
	if (cardsToShow >= sentences.length) {
		button.style.display = "none";
	}
}

function remove() {
	const cards = document.querySelectorAll(".card");
	for (let i = cards.length - 1; i >= cards.length - kek + 8 && i >= 0; i--) {
		if (kek > i) {
			cards[i].remove();
			kek--;
		}
	}
}

document.onload = display();
