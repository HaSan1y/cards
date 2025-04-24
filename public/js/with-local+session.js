class CountsessionStorage {
	constructor() {
		this.dbName = "mysesDatabase";
		this.dbVersion = 1;
		this.displayMax = 10;
		this.db;
		this.displayedCardIds = new Set();
		this.solution = [];
		this.sentence = [];
	}
	increment() {
		this.displayMax++;
	}
	decrement() {
		this.displayMax--;
	}
}
const sesCount = new CountsessionStorage();
// const settings = { theme: "light" };
// if (isLocalDB) {
// 	localStorage.setItem("settings", JSON.stringify(settings));
// 	let value = JSON.parse(localStorage.getItem("settings"));
// 	localStorage.removeItem("key");
// 	localStorage.clear();

// 	console.log("Retrieved settings:", value);
// } else if (isSessionDB) {
async function handleSessionSubmit(event) {
	event.preventDefault();
	const [s1, s2, s3] = [document.getElementById("s1").value, document.getElementById("s2").value, document.getElementById("s3").value];
	const sentences = [s1, s2].filter(Boolean);
	const solutions = [s3].filter(Boolean);

	try {
		displaysesCards(sentences, solutions, [s1, s2]);
	} catch (error) {
		console.error("Error displaying cards:", error);
	}
}
function displaysesCards(sen, sol, newIds) {
	let totalCards = document.querySelectorAll(".myCard").length;
	let i = 0;
	let solIndex = sessionStorage.getItem("solIndex") || 0;

	while (i < sen.length && totalCards < sesCount.displayMax + sol.length) {
		const cardId = `card-${sen[i].id}`;

		if (!sesCount.displayedCardIds.has(cardId) || newIds.includes(sen[i].id)) {
			let sentences = [sen[i]];
			if (i + 1 < sen.length) {
				sentences.push(sen[i + 1]);
			}
			const card = createsesCard(sentences, sol[solIndex], cardId);

			cardHolder.appendChild(card);
			sesCount.displayedCardIds.add(cardId);

			totalCards++;
			solIndex++;
			i += 2;

			sessionStorage.setItem("card", JSON.stringify(card));
			let value = JSON.parse(sessionStorage.getItem("card"));
			sessionStorage.removeItem("card");
			sessionStorage.clear();

			console.log("Retrieved cards:", value);
		} else {
			i += 2;
		}
		sessionStorage.setItem("solIndex", solIndex);
	}
}
function createsesInnerCard(sentences, solution) {
	const frontSide = createsesFrontSide(sentences);
	const backSide = createsesBackSide(solution);
	return { frontSide, backSide };
}
function createsesCard(sentences, solution, cardId) {
	const card = document.createElement("div");
	card.classList.add("myCard");
	card.id = cardId;
	const cardsCreation = createsesInnerCard(sentences, solution);
	const innerCard = document.createElement("div");
	innerCard.classList.add("innerCard");
	const { frontSide, backSide } = cardsCreation;
	innerCard.appendChild(frontSide);
	innerCard.appendChild(backSide);
	card.appendChild(innerCard);
	// card.addEventListener("click", () => {
	// 	togglesesCardContentdb(card, solution);
	// });
	return card;
}
function createsesFrontSide(sentences) {
	const frontSide = document.createElement("div");
	frontSide.classList.add("frontSide");

	const title = document.createElement("h2");
	title.classList.add("title");
	title.textContent = sentences[0].sentence;

	const subtitle = document.createElement("p");
	subtitle.textContent = sentences[1] ? sentences[1].sentence : "";

	frontSide.appendChild(title);
	frontSide.appendChild(subtitle);
	return frontSide;
}

function createsesBackSide(solution) {
	const backSide = document.createElement("div");
	backSide.classList.add("backSide");

	const head = document.createElement("h2");
	head.classList.add("backHead");
	// head.textContent = solution.solution ? solution.solution : "";

	backSide.appendChild(head);
	// const deleteButton = createsesDeleteButton();
	// backSide.appendChild(deleteButton);
	return backSide;
}
// Use sessionStorage for production
// sessionStorage.setItem("settings", JSON.stringify(settings));
// let value = JSON.parse(sessionStorage.getItem("settings"));
// sessionStorage.removeItem("key");
// sessionStorage.clear();

// console.log("Retrieved settings:", value);
// } else {
// 	console.warn("No storage available for settings.");
// }
