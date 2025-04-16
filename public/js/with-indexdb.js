//developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API

// self.indexedDB.open
class Count {
	constructor() {
		this.dbName = "myDatabase";
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

const count = new Count();
function openDatabase() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(count.dbName, count.dbVersion);
		request.onerror = (event) => {
			console.error("Error opening database:", event.target.error);
			reject(event.target.error);
		};

		request.onsuccess = (event) => {
			// db = DBOpenRequest.result;
			count.db = event.target.result;

			console.log("Database opened successfully");
			resolve(count.db);
		};

		request.onupgradeneeded = (event) => {
			count.db = event.target.result;
			console.log("Database upgrade needed");

			if (!count.db.objectStoreNames.contains("sentences")) {
				const sentencesStore = count.db.createObjectStore("sentences", { keyPath: "id", autoIncrement: true });
				sentencesStore.createIndex("sentence", "sentence", { unique: true });
			}

			if (!count.db.objectStoreNames.contains("solutions")) {
				const solutionsStore = count.db.createObjectStore("solutions", { keyPath: "id", autoIncrement: true });
				solutionsStore.createIndex("solution", "solution", { unique: true });
				// solutionsStore.add({ id: 0, solution: "initialization" });
			}

			console.log("Database upgraded successfully");
		};
	});
}

async function handleSubmit(event) {
	event.preventDefault();
	const [tt1, tt2, tt3] = [document.getElementById("tt1").value, document.getElementById("tt2").value, document.getElementById("tt3").value];
	const sentences = [tt1, tt2].filter(Boolean);
	const solutions = [tt3].filter(Boolean);

	try {
		await openDatabase();
		const transaction = count.db.transaction(["sentences", "solutions"], "readwrite");
		const [sentencesStore, solutionsStore] = [transaction.objectStore("sentences"), transaction.objectStore("solutions")];

		// sentences.forEach((sentence) => {
		// 	sentencesStore.add({ sentence: sentence });
		// });
		// sentencesStore.put({ id: sentencesStore.indexNames.length, sentence: sentences[1] });
		// solutions.forEach((solution, id) => {
		// 	solutionsStore.add({ solution: solution, id });
		// });
		const addedIds = [];
		for (const sentence of sentences) {
			sentencesStore.add({ sentence });
			addedIds.push(sentencesStore.result);
		}
		// for (const sentence of sentences) {
		// 	const request = sentencesStore.add({ sentence });
		// 	request.onsuccess = (event) => {
		// 		addedIds.push(event.target.result);
		// 	};
		// }
		for (const solution of solutions) {
			await solutionsStore.add({ solution });
		}

		await transaction.done;
		// await transaction.complete;
		console.log(`Data added to ${Array.from(transaction.objectStoreNames).join(", ")}`);
		await display(addedIds);
		// transaction.oncomplete = () => {

		transaction.onerror = (event) => {
			console.warn(
				`Transaction error: ${transaction.objectStoreNames[0]}, ${transaction.objectStoreNames[1]} store:${event.target.error}.error: let me guess, you submited something which is already existing in your indexDB`,
			);
			document.getElementsByClassName("msg")[0].textContent = "Error: Duplicate entry! (or other error occurred. Console-Details f12.)";
		};
		// window.location.reload();
	} catch (error) {
		console.error("Error handling submit:", error);
	}
}

async function display(newIds = []) {
	const sentencesRequest = count.db.transaction("sentences", "readonly").objectStore("sentences").getAll();
	sentencesRequest.onsuccess = (event) => {
		const sentences = event.target.result;

		solutionsRequest = count.db.transaction("solutions", "readonly").objectStore("solutions").getAll();
		solutionsRequest.onsuccess = (event) => {
			const solutions = event.target.result;
			displayCards(sentences, solutions, newIds);
		};
		solutionsRequest.onerror = (event) => {
			console.error("Error reading solution from database:", event.target.errorCode);
		};
		sentencesRequest.onerror = (event) => {
			console.error("Error reading sentences from database:", event.target.errorCode);
		};
	};
}
function displayCards(sen, sol, newIds) {
	let totalCards = document.querySelectorAll(".myCard").length;
	let i = 0;
	let solIndex = sessionStorage.getItem("solIndex") || 0;

	while (i < sen.length && totalCards < count.displayMax + sol.length) {
		const cardId = `card-${sen[i].id}`;
		// 	 `card-${Math.floor(i / 2)}`;
		if (!count.displayedCardIds.has(cardId) || newIds.includes(sen[i].id)) {
			// const card = createCard(sentences.slice(i, i + 2), sol[solIndex], cardId);
			let sentences = [sen[i]];
			if (i + 1 < sen.length) {
				// not sure what is happening here excactly but it works.. right?!
				sentences.push(sen[i + 1]);
			}
			const card = createCard(sentences, sol[solIndex], cardId);
			// const card = createCard([sen[i]], sol[solIndex], cardId);

			cardHolder.appendChild(card);
			count.displayedCardIds.add(cardId);
			// count.ıncrement();
			totalCards++;
			solIndex++;
			i += 2;
		} else {
			i += 2; // Increment the index by 2 if the card is already displayed
		}
		sessionStorage.setItem("solIndex", solIndex);
	}
	// if (i < sen.length) {
	// 	setTimeout(() => displayCards(sen, sol, newIds), 0);
	// }
}
window.addEventListener("beforeunload", () => {
	sessionStorage.setItem("solIndex", 0);
});
function createDeleteButton() {
	const deleteButton = document.createElement("button");
	deleteButton.textContent = "Delete";
	deleteButton.classList.add("removebtn");
	deleteButton.onclick = () => {
		const cardId = deleteButton.closest(".myCard").id;
		deleteFromDatabase(cardId.split("-")[1]);
		deleteButton.closest(".myCard").remove();
		count.displayedCardIds.delete(cardId);
		console.log("Card deleted");
	};
	return deleteButton;
}
function createCard(sentences, solution, cardId) {
	const card = document.createElement("div");
	card.classList.add("myCard");
	card.id = cardId;
	const cardsCreation = createInnerCard(sentences, solution);
	const innerCard = document.createElement("div");
	innerCard.classList.add("innerCard");
	const { frontSide, backSide } = cardsCreation;
	innerCard.appendChild(frontSide);
	innerCard.appendChild(backSide);
	card.appendChild(innerCard);
	card.addEventListener("click", () => {
		toggleCardContentdb(card, solution);
	});
	return card;
}
function createInnerCard(sentences, solution) {
	const frontSide = createFrontSide(sentences);
	const backSide = createBackSide(solution);
	return { frontSide, backSide };
}

function createFrontSide(sentences) {
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

function createBackSide(solution) {
	const backSide = document.createElement("div");
	backSide.classList.add("backSide");

	const head = document.createElement("h2");
	head.classList.add("backHead");
	// head.textContent = solution.solution ? solution.solution : "";

	backSide.appendChild(head);
	const deleteButton = createDeleteButton();
	backSide.appendChild(deleteButton);
	return backSide;
}
async function toggleCardContentdb(card, solution) {
	const innerCard = card.querySelector(".innerCard");
	const backHead = innerCard.querySelector(".backHead");

	// if (solution) {
	// 	backHead.textContent = solution.solution;
	// 	innerCard.classList.toggle("flipped");
	// } else {
	// 	console.warn(`No solution found for card ${card.id}`);
	// }
	if (!solution) {
		console.warn(`No solution found for card ${card.id}`);
		return;
	}

	backHead.textContent = solution.solution;
	innerCard.classList.toggle("flipped");
}
async function ensureDatabaseConnection() {
	if (!count.db || count.db.closed) {
		await openDatabase();
		display();
	}
}
async function deleteFromDatabase(id) {
	try {
		await ensureDatabaseConnection();
		const transaction = count.db.transaction(["sentences", "solutions"], "readwrite");
		const sentencesStore = transaction.objectStore("sentences");
		const solutionsStore = transaction.objectStore("solutions");

		const idAsInt = parseInt(id, 10); // Validate and parse the ID as an integer
		if (isNaN(idAsInt)) {
			console.error(`Invalid ID: ${id}`);
			return;
		}
		const deleteSentenceRequest = sentencesStore.delete(idAsInt);
		deleteSentenceRequest.onerror = (event) => {
			console.error(`Error deleting sentence with ID ${idAsInt}:`, event.target.error);
		};
		const deleteSentenceRequest2 = sentencesStore.delete(idAsInt + 1);
		// await Promise.all([deleteSentenceRequest, deleteSolutionRequest]);
		deleteSentenceRequest2.onerror = (event) => {
			console.error(`Error deleting sentence with ID ${idAsInt + 1}:`, event.target.error);
		};

		const deleteSolutionRequest = solutionsStore.delete(Math.floor(idAsInt / 2) + 1);
		deleteSolutionRequest.onsuccess = () => {
			console.log(Math.floor(idAsInt / 2) + 1); // Log success message
		};
		deleteSolutionRequest.onerror = (event) => {
			console.error(`Error deleting solution with ID ${Math.floor(idAsInt / 2)}:`, event.target.error);
		};

		transaction.oncomplete = () => {
			console.log(`Data with ID ${idAsInt} deleted from database`);
		};
		transaction.onerror = (event) => {
			console.error(`Error deleting data with ID ${idAsInt}:`, event.target.error);
		};
		if (count.displayMax > 10) {
			count.decrement();
		}
		// reload page after a second
		setTimeout(() => {
			window.location.reload();
		}, 300);
	} catch (error) {
		console.error("Error deleting from database:", error);
	}
}
// called via button onclick="wipeData()"
function wipeData() {
	const removeDataFromStore = /*async*/ (storeName) => {
		const transaction = count.db.transaction([storeName], "readwrite");
		const store = transaction.objectStore(storeName);

		const clearRequest = store.clear();

		clearRequest.onerror = (event) => {
			console.error(`Error removing data from ${storeName} store:`, event.target.error);
		};
		// await clearRequest;
		clearRequest.onsuccess = () => {
			console.log(`Data removed from ${storeName} store successfully`);
		};
	};
	removeDataFromStore("sentences");
	removeDataFromStore("solutions");

	const cards = document.querySelectorAll('[id^="card-"]');
	cards.forEach((card) => card.remove());
	count.displayMax = 10;
	window.location.reload();
}
