//developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
const dbName = "myDatabase";
const dbVersion = 1;
let db;
// self.indexedDB.open

function openDatabase() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(dbName, dbVersion);
		request.onerror = (event) => {
			console.error("Error opening database:", event.target.error);
			reject(event.target.error);
		};

		request.onsuccess = (event) => {
			// db = DBOpenRequest.result;
			db = event.target.result;

			console.log("Database opened successfully");
			resolve(db);
			// display();
		};

		request.onupgradeneeded = (event) => {
			db = event.target.result;
			console.log("Database upgrade needed");

			if (!db.objectStoreNames.contains("sentences")) {
				const sentencesStore = db.createObjectStore("sentences", { keyPath: "id", autoIncrement: true });
				sentencesStore.createIndex("sentence", "sentence", { unique: true });
			}

			if (!db.objectStoreNames.contains("solutions")) {
				const solutionsStore = db.createObjectStore("solutions", { keyPath: "id", autoIncrement: true });
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
		const transaction = db.transaction(["sentences", "solutions"], "readwrite");
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
			const request = sentencesStore.add({ sentence });
			request.onsuccess = (event) => {
				addedIds.push(event.target.result);
			};
		}
		for (const solution of solutions) {
			await solutionsStore.add({ solution });
		}

		await transaction.complete;
		console.log(`Data added to ${transaction.objectStoreNames[0]}, ${transaction.objectStoreNames[1]} store successfully`);
		await display(addedIds);
		// transaction.oncomplete = () => {

		transaction.onerror = (event) => {
			console.error(`Transaction error: ${transaction.objectStoreNames[0]}, ${transaction.objectStoreNames[1]} store:`, event.target.error);
		};
	} catch (error) {
		console.error("Error handling submit:", error);
	}
}
let displayedCardIds = new Set();
async function display(newIds = []) {
	const sentencesRequest = db.transaction("sentences", "readonly").objectStore("sentences").getAll();
	sentencesRequest.onsuccess = (event) => {
		const sentences = event.target.result;

		solutionsRequest = db.transaction("solutions", "readonly").objectStore("solutions").getAll();
		solutionsRequest.onsuccess = (event) => {
			const solutions = event.target.result;
			console.log(solutions, sentences);
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
	let displayMax = 10;
	let totalCards = document.querySelectorAll(".myCard").length;
	let i = 0;
	let solIndex = 0;

	while (i < sen.length && totalCards < displayMax) {
		const cardId = `card-${sen[i].id}`;
		// 	 `card-${Math.floor(i / 2)}`;
		if (!displayedCardIds.has(cardId) || newIds.includes(sen[i].id)) {
			let sentences = [sen[i]];
			if (i + 1 < sen.length) {
				sentences.push(sen[i + 1]);
			}
			const card = createCard(sentences, sol[solIndex], cardId);
			cardHolder.appendChild(card);
			displayedCardIds.add(cardId);
			totalCards++;
			solIndex++;
			i += 2;
		} else {
			i += 2; // Increment the index by 2 if the card is already displayed
		}
	}
	// for (let i = 0; i < sen.length && totalCards < showmoredb; i++) {
	// 	if (displayedCardIds.has(cardId)) {//.includes
	// 		continue; // Skip creating the card if it's already displayed
	// 	}

	// }
}
function createCard(sentences, solution, cardId) {
	const card = document.createElement("div");
	card.classList.add("myCard");
	card.id = cardId;

	const deleteButton = document.createElement("button");
	deleteButton.textContent = "delete";
	deleteButton.classList.add("removebtn");
	deleteButton.onclick = (e) => {
		e.stopPropagation();
		card.remove();
		displayedCardIds.delete(cardId);
		deleteFromDatabase(cardId.split("-")[1]);
		console.log("Card deleted");
	};

	const innerCard = document.createElement("div");
	innerCard.classList.add("innerCard");

	const frontSide = document.createElement("div");
	frontSide.classList.add("frontSide", "bi", "bi-hand-index-fill");

	const backSide = document.createElement("div");
	backSide.classList.add("backSide");
	const sentence1 = document.createElement("h2");
	sentence1.textContent = sentences[0].sentence;

	const sentence2 = document.createElement("p");
	if (sentences[1]) {
		sentence2.textContent = sentences[1].sentence;
	} else {
		sentence2.textContent = "";
	}
	// const heading = document.createElement("h2");
	// const paragraph = document.createElement("p");
	// for (let i = 0; i < sentences.length; i++) {
	// 	// && totalCards < showmoredb
	// 	heading.textContent = sentences[i].sentence;
	// 	// if (i + 1 < sen.length) {
	// 	paragraph.textContent = sentences[i + 1].sentence;
	// 	i++;
	// }
	frontSide.appendChild(sentence1);
	frontSide.appendChild(sentence2);
	// frontSide.appendChild(heading);
	// frontSide.appendChild(paragraph);
	innerCard.appendChild(frontSide);
	innerCard.appendChild(backSide);
	card.appendChild(deleteButton);
	card.appendChild(innerCard);

	card.addEventListener("click", () => {
		toggleCardContentdb(card, solution);
	});

	return card;
}

async function toggleCardContentdb(card, solution) {
	const innerCard = card.querySelector(".innerCard");
	const backSide = innerCard.querySelector(".backSide");

	if (solution) {
		backSide.textContent = solution.solution;
		innerCard.classList.toggle("flipped");
	} else {
		console.warn(`No solution found for card ${card.id}`);
	}
	// try {
	// 	await ensureDatabaseConnection();
	// 	if (!db) {
	// 		throw new Error("Database not available");
	// 	}
	// 	const innerCard = card.querySelector(".innerCard");
	// 	const frontSide = innerCard.querySelector(".frontSide");
	// 	const backSide = innerCard.querySelector(".backSide");
	// 	const cardIndex = parseInt(card.id.split("-")[1]);
	// 	const dbTransaction = db.transaction("solutions", "readonly");
	// 	const solutionsStore = dbTransaction.objectStore("solutions");
	// 	// const solution = await new Promise((resolve, reject) => {
	// 	// 	const request = solutionsStore.get(cardIndex + 1);
	// 	// 	request.onsuccess = (event) => resolve(event.target.result);
	// 	// 	request.onerror = (event) => reject(event.target.error);
	// 	// });
	// 	const allSolutions = await new Promise((resolve, reject) => {
	// 		const request = solutionsStore.getAll();
	// 		request.onsuccess = (event) => resolve(event.target.result);
	// 		request.onerror = (event) => reject(event.target.error);
	// 	});
	// 	// Find the solution that matches the card index
	// 	const solution = allSolutions[cardIndex];
	// 	if (solution) {
	// 		backSide.textContent = solution.solution;
	// 		innerCard.classList.toggle("flipped");
	// 	} else {
	// 		console.warn(`No solution found for card index ${cardIndex}`);
	// 	}
	// } catch (error) {
	// 	console.error("Error reading solution from database:", error);
	// }
}
async function ensureDatabaseConnection() {
	if (!db || db.closed) {
		await openDatabase();
	}
}
async function deleteFromDatabase(id) {
	try {
		await ensureDatabaseConnection();
		const transaction = db.transaction(["sentences", "solutions"], "readwrite");
		const sentencesStore = transaction.objectStore("sentences");
		const solutionsStore = transaction.objectStore("solutions");

		const idAsInt = parseInt(id, 10); // Validate and parse the ID as an integer
		if (isNaN(idAsInt)) {
			console.error(`Invalid ID: ${id}`);
			return;
		}
		const deleteSentenceRequest = sentencesStore.delete(idAsInt);
		deleteSentenceRequest.onsuccess = () => {
			console.log("hello!!!!!!!!!"); // Log success message
		};
		deleteSentenceRequest.onerror = (event) => {
			console.error(`Error deleting sentence with ID ${idAsInt}:`, event.target.error);
		};

		const deleteSentenceRequest2 = sentencesStore.delete(idAsInt + 1);
		deleteSentenceRequest2.onsuccess = () => {
			console.log("hello!!!!!!!!!"); // Log success message
		};
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
		// await sentencesStore.delete(parseInt(id));
		// console.log("hello!!!!!!!!!");
		// await sentencesStore.delete(parseInt(id) + 1);

		// console.log("hello!!!!!!!!!");
		// await solutionsStore.delete(Math.floor(parseInt(id) / 2));
		// console.log(Math.floor(parseInt(id) / 2));

		// await transaction.complete;
		// console.log(`Data with id ${id} deleted from database`);
	} catch (error) {
		console.error("Error deleting from database:", error);
	}
}
// called via button onclick="wipeData()"
function wipeData() {
	const removeDataFromStore = (storeName) => {
		const transaction = db.transaction([storeName], "readwrite");
		const store = transaction.objectStore(storeName);

		const clearRequest = store.clear();

		clearRequest.onsuccess = () => {
			console.log(`Data removed from ${storeName} store successfully`);
		};

		clearRequest.onerror = (event) => {
			console.error(`Error removing data from ${storeName} store:`, event.target.error);
		};
	};
	removeDataFromStore("sentences");
	removeDataFromStore("solutions");
	// removeDataFromStore("sentences");

	const cards = document.querySelectorAll('[id^="card-"]');

	if (cards.length >= 0) {
		cards.forEach((card) => card.remove());
		console.log(cards);
	}
	window.location.reload();
}
