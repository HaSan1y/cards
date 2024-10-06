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
				// createObjectStore.id = 0;
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
		for (const sentence of sentences) {
			await sentencesStore.add({ sentence });
		}
		for (const solution of solutions) {
			await solutionsStore.add({ solution });
		}

		await transaction.complete;
		console.log(`Data added to ${transaction.objectStoreNames[0]}, ${transaction.objectStoreNames[1]} store successfully`);
		display();
		// transaction.oncomplete = () => {
		// };
		transaction.onerror = (event) => {
			console.error(`Transaction error: ${transaction.objectStoreNames[0]}, ${transaction.objectStoreNames[1]} store:`, event.target.error);
		};
	} catch (error) {
		console.error("Error handling submit:", error);
	}
}

async function display() {
	const sentencesRequest = db.transaction("sentences", "readonly").objectStore("sentences").getAll();
	sentencesRequest.onsuccess = (event) => {
		const sentences = event.target.result;

		solutionsRequest = db.transaction("solutions", "readonly").objectStore("solutions").getAll();
		solutionsRequest.onsuccess = (event) => {
			const solutions = event.target.result;
			console.log(solutions, sentences);
			displayCards(sentences, solutions);
		};
		solutionsRequest.onerror = (event) => {
			console.error("Error reading solution from database:", event.target.errorCode);
		};
		sentencesRequest.onerror = (event) => {
			console.error("Error reading sentences from database:", event.target.errorCode);
		};
	};
}

function displayCards(sen, sol) {
	let showmoredb = 6; //display max 6
	let totalCards = sol.length;
	for (let i = 0; i < sen.length && totalCards < showmoredb; i++) {
		const card = document.createElement("div");
		card.classList.add("myCard");
		card.id = `card-${Math.floor(i / 2)}`;

		const deleteButton = document.createElement("button");
		deleteButton.textContent = "delete";
		deleteButton.classList.add("removebtn");
		deleteButton.onclick = (e) => {
			e.stopPropagation();
			card.remove();
			console.log("Card deleteddb");
		};

		const innerCard = document.createElement("div");
		innerCard.classList.add("innerCard");

		const frontSide = document.createElement("div");
		frontSide.classList.add("frontSide", "bi", "bi-hand-index-fill");

		const backSide = document.createElement("div");
		backSide.classList.add("backSide");

		const heading = document.createElement("h2");
		heading.textContent = sen[i].sentence;

		const paragraph = document.createElement("p");
		if (i + 1 < sen.length) {
			paragraph.textContent = sen[i + 1].sentence;
			i++;
		}

		frontSide.appendChild(heading);
		frontSide.appendChild(paragraph);
		innerCard.appendChild(frontSide);
		innerCard.appendChild(backSide);
		card.appendChild(deleteButton);
		card.appendChild(innerCard);

		card.addEventListener("click", () => {
			toggleCardContentdb(card);
		});
		cardHolder.appendChild(card);
		totalCards++;
	}
}
async function ensureDatabaseConnection() {
	if (!db || db.closed) {
		await openDatabase();
	}
}
async function toggleCardContentdb(card) {
	try {
		await ensureDatabaseConnection();
		if (!db) {
			throw new Error("Database not available");
		}
		const innerCard = card.querySelector(".innerCard");
		const frontSide = innerCard.querySelector(".frontSide");
		const backSide = innerCard.querySelector(".backSide");
		const cardIndex = parseInt(card.id.split("-")[1]);

		const dbTransaction = db.transaction("solutions", "readonly");
		const solutionsStore = dbTransaction.objectStore("solutions");

		// const solution = await new Promise((resolve, reject) => {
		// 	const request = solutionsStore.get(cardIndex + 1);

		// 	request.onsuccess = (event) => resolve(event.target.result);
		// 	request.onerror = (event) => reject(event.target.error);
		// });
		const allSolutions = await new Promise((resolve, reject) => {
			const request = solutionsStore.getAll();
			request.onsuccess = (event) => resolve(event.target.result);
			request.onerror = (event) => reject(event.target.error);
		});

		// Find the solution that matches the card index
		const solution = allSolutions[cardIndex];

		if (solution) {
			backSide.textContent = solution.solution;
			innerCard.classList.toggle("flipped");
		} else {
			console.warn(`No solution found for card index ${cardIndex}`);
		}
	} catch (error) {
		console.error("Error reading solution from database:", error);
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
	removeDataFromStore("sentences");

	const cards = document.querySelectorAll('[id^="card-"]');

	if (cards.length >= 0) {
		cards.forEach((card) => card.remove());
		console.log(cards);
	}
	// window.location.reload();
}
