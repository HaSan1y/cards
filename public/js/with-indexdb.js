//developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API

// self.indexedDB.open
class Count {
	constructor() {
		this.dbName = "myDatabase";
		this.dbVersion = 1;
		this.displayMax = 10;
		this.db;
		this.displayedCardIds = new Set();
		// No longer need separate sentence/solution arrays here
		// this.solution = [];
		// this.sentence = [];
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

			// Create a single store for cards
			if (!count.db.objectStoreNames.contains("cards")) {
				const cardsStore = count.db.createObjectStore("cards", { keyPath: "id", autoIncrement: true });
				// Optional: Add indexes if you need to search by sentence1, sentence2, or solution later
			}

			console.log("Database upgraded successfully");
		};
	});
}

async function handleSubmit(event) {
	event.preventDefault();
	const [tt1, tt2, tt3] = [document.getElementById("tt1").value, document.getElementById("tt2").value, document.getElementById("tt3").value];
	// Prepare the card data object
	const cardData = {
		sentence1: tt1 || "", // Ensure strings, even if empty
		sentence2: tt2 || "",
		solution: tt3 || "",
	};

	try {
		await openDatabase();
		const transaction = count.db.transaction(["cards"], "readwrite");
		const cardsStore = transaction.objectStore("cards");

		const request = cardsStore.add(cardData);

		// Use promises for cleaner async handling
		await new Promise((resolve, reject) => {
			request.onsuccess = (event) => {
				const addedId = event.target.result; // Get the auto-generated ID
				console.log(`Card added with ID: ${addedId}`);
				display([addedId]); // Pass the new ID to display
				resolve();
			};
			request.onerror = (event) => {
				console.error("Error adding card:", event.target.error);
				reject(event.target.error);
			};
		});

		transaction.onerror = (event) => {
			console.warn(
				`Transaction error: ${transaction.objectStoreNames[0]}, ${transaction.objectStoreNames[1]} store:${event.target.error}.error: let me guess, you submited something which is already existing in your indexDB`,
			);
			document.getElementsByClassName("msg")[0].textContent = "Error: Duplicate entry! (or other error occurred. Console-Details f12.)";
		};
	} catch (error) {
		console.error("Error handling submit:", error);
	}
}

async function display(newIds = []) {
	// Fetch all cards from the single store
	const transaction = count.db.transaction("cards", "readonly");
	const store = transaction.objectStore("cards");
	const request = store.getAll();

	request.onsuccess = (event) => {
		const cardsData = event.target.result;
		displayCards(cardsData, newIds); // Pass the array of card objects
	};
	request.onerror = (event) => {
		console.error("Error reading cards from database:", event.target.error);
	};
}

// Updated to accept an array of card objects
function displayCards(cardsData, newIds) {
	// Optional: Clear existing cards if needed, or just append new ones
	// cardHolder.innerHTML = ""; count.displayedCardIds.clear(); // If you want a full refresh
	console.log("Displaying cards. Data received:", cardsData); // Log received data
	const cardHolder = document.getElementById("cardHolder");
	cardsData.forEach((cardData) => {
		if (!cardData || typeof cardData !== "object") {
			console.warn("Invalid cardData encountered and skipped:", cardData);
			return;
		}
		if (!("id" in cardData)) {
			console.warn("cardData missing 'id' property and skipped:", cardData);
			return;
		}
		const cardId = `card-${cardData.id}`;
		console.log(`Processing cardData with id ${cardData.id}:`, cardData); // Log each item
		if (!count.displayedCardIds.has(cardId) || newIds.includes(cardData.id)) {
			const card = createCard(cardData); // Pass the whole card object
			if (!(card instanceof Node)) {
				console.warn("createCard did not return a DOM Node, skipping appendChild:", card);
				return;
			}
			cardHolder.appendChild(card);
			count.displayedCardIds.add(cardId);
			// count.ıncrement();
		} else {
			// Card already displayed, do nothing or update if needed
		}
	});
}
function createDeleteButton() {
	const deleteButton = document.createElement("button");
	deleteButton.textContent = "Delete";
	deleteButton.classList.add("removebtn");
	deleteButton.onclick = () => {
		const cardId = deleteButton.closest(".myCard").id;
		deleteFromDatabase(cardId.split("-")[1]);
		// Remove the element from DOM after successful DB deletion (handled in deleteFromDatabase now)
		// deleteButton.closest(".myCard").remove();
		// count.displayedCardIds.delete(cardId);
		// console.log("Card deleted");
	};
	return deleteButton;
}

// Updated to accept a single card data object
function createCard(cardData) {
	console.log("createCard called with:", cardData); // Log input to createCard
	if (!cardData || typeof cardData !== "object") {
		console.error("Invalid cardData passed to createCard:", cardData);
		return null;
	}
	if (!("id" in cardData)) {
		console.error("cardData missing 'id' property in createCard:", cardData);
		return null;
	}
	try {
		const card = document.createElement("div");
		card.classList.add("myCard");
		card.id = `card-${cardData.id}`; // Set DOM ID based on the object's ID
		const cardsCreation = createInnerCard(cardData); // Pass the whole object
		if (!cardsCreation || typeof cardsCreation !== "object") {
			console.error("createInnerCard did not return an object:", cardsCreation);
			return null;
		}
		const { frontSide, backSide } = cardsCreation;
		if (!(frontSide instanceof Node) || !(backSide instanceof Node)) {
			console.error("frontSide or backSide is not a DOM Node:", frontSide, backSide);
			return null;
		}
		const innerCard = document.createElement("div");
		innerCard.classList.add("innerCard");
		innerCard.appendChild(frontSide);
		innerCard.appendChild(backSide);
		card.appendChild(innerCard);
		// card.addEventListener("click", () => { // Keep or remove flip functionality as needed
		// 	toggleCardContentdb(card, cardData.solution);
		// });
		console.log("createCard returning:", card); // Log the element being returned
		return card;
	} catch (error) {
		console.error("Error in createCard:", error);
		return null;
	}
}
function createInnerCard(sentences, solution) {
	const frontSide = createFrontSide(sentences);
	const backSide = createBackSide(solution);
	return { frontSide, backSide };
}

// Updated to accept a single card data object
function createInnerCard(cardData) {
	console.log("createInnerCard called with:", cardData);
	try {
		const frontSide = createFrontSide(cardData);
		const backSide = createBackSide(cardData);
		if (!(frontSide instanceof Node) || !(backSide instanceof Node)) {
			console.error("createInnerCard: frontSide or backSide is not a DOM Node:", frontSide, backSide);
			return null;
		}
		return { frontSide, backSide };
	} catch (error) {
		console.error("Error in createInnerCard:", error);
		return null;
	}
}

function createFrontSide(cardData) {
	const frontSide = document.createElement("div");
	frontSide.classList.add("frontSide");

	const title = document.createElement("h2");
	title.classList.add("title");
	title.textContent = cardData.sentence1; // Use properties from the object

	const subtitle = document.createElement("p");
	subtitle.textContent = cardData.sentence2;

	frontSide.appendChild(title);
	frontSide.appendChild(subtitle);
	return frontSide;
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
	// if (!solution) { // Solution is now just a string property
	// 	console.warn(`No solution found for card ${card.id}`);
	// 	return;
	// }

	backHead.textContent = solution; // Display the solution string
	innerCard.classList.toggle("flipped");
}

// Updated to accept a single card data object
function createBackSide(cardData) {
	const backSide = document.createElement("div");
	backSide.classList.add("backSide");

	const head = document.createElement("h2");
	head.classList.add("backHead");
	head.textContent = cardData.solution; // Use property from the object
	backSide.appendChild(head);
	const deleteButton = createDeleteButton(); // Delete button logic remains similar
	backSide.appendChild(deleteButton);
	return backSide;
}
async function ensureDatabaseConnection() {
	if (!count.db || count.db.closed) {
		await openDatabase();
		display();
	}
}

// Simplified delete function
async function deleteFromDatabase(id) {
	try {
		await ensureDatabaseConnection();
		const transaction = count.db.transaction(["cards"], "readwrite");
		const store = transaction.objectStore("cards");

		const idAsInt = parseInt(id, 10);
		if (isNaN(idAsInt)) {
			console.error(`Invalid ID: ${id}`);
			return;
		}

		const request = store.delete(idAsInt);

		request.onsuccess = () => {
			console.log(`Card with ID ${idAsInt} deleted from database`);
			// Remove from DOM now that DB operation is successful
			const cardElement = document.getElementById(`card-${idAsInt}`);
			if (cardElement) {
				cardElement.remove();
				count.displayedCardIds.delete(`card-${idAsInt}`);
			}
			if (count.displayMax > 10) {
				// Keep this logic if needed
				count.decrement();
			}
		};
		request.onerror = (event) => {
			console.error(`Error deleting card with ID ${idAsInt}:`, event.target.error);
		};

		transaction.onerror = (event) => {
			console.error(`Error deleting data with ID ${idAsInt}:`, event.target.error);
		};
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
	// Wipe the single 'cards' store
	removeDataFromStore("cards");

	const cards = document.querySelectorAll('[id^="card-"]');
	cards.forEach((card) => card.remove());
	count.displayMax = 10;
	window.location.reload();
}
