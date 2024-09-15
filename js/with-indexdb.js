//developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API

window.onload = () => {
	document.documentElement.scrollIntoView();
};
const cardHolder = document.getElementById("card-holder");
// self.indexedDB.open
const request = window.indexedDB.open("myDatabase", 1, { objectStores: 0 });
request.onerror = (request) => {
	console.error("Error opening database:", request.errorCode);
};

request.onupgradeneeded = (event) => {
	const db = event.target.result;
	const sentencesStore = db.createObjectStore("sentences", { keyPath: "id", autoIncrement: true });
	sentencesStore.createIndex("sentence", "sentence", { unique: true });
	const solutionsStore = db.createObjectStore("solutions", { keyPath: "id", autoIncrement: true });
	// creates outertable
	solutionsStore.createIndex("solution", "solution", { unique: true });
	// create inner table
	console.log("4Databases create/load/indexed successfully");
};
request.onsuccess = (event) => {
	// db = DBOpenRequest.result;
	db = event.target.result;

	// event.target.parentNode.parentNode.removeChild(event.target.parentNode);
	// note.innerHTML += `<li> "${dataTask}" Database opened successfully.</li>`
	// note.appendChild(createListItem('App initialised.'));
	console.log("Database opened successfully");
	display();
};

document.getElementById("txtbtn").addEventListener("submit", (event) => {
	event.preventDefault();

	// const newItem = [ { t1: t1.value, t2: t2.value, t3: t3.value}, ];
	const [t1, t2, t3] = [document.getElementById("t1").value, document.getElementById("t2").value, document.getElementById("t3").value];
	const sentences = [t1, t2];
	const solutions = [t3];

	const transaction = db.transaction(["sentences", "solutions"], "readwrite");
	const [sentencesStore, solutionsStore] = [transaction.objectStore("sentences"), transaction.objectStore("solutions")];

	sentences.forEach((sentence) => {
		sentencesStore.add({ sentence: sentence });
	});
	// sentencesStore.put({ id: sentencesStore.indexNames.length, sentence: sentences[1] });
	solutions.forEach((solution) => {
		solutionsStore.add({ solution: solutions[0] });
	});
	transaction.onsuccess = (event) => {
		console.log(`data success: ${transaction.objectStoreNames[0]}, ${transaction.objectStoreNames[1]}`, event.target.error);
	};
	transaction.oncomplete = () => {
		// note.appendChild(createListItem('Transaction completed: database modification finished.'));
		// Update the display of data to show the newly added item, by running displayData() again.
		console.log(`Data added to ${transaction.objectStoreNames[0]}, ${transaction.objectStoreNames[1]} store successfully`);
		display();
	};

	transaction.onerror = (event) => {
		console.error(`Error reading Data: ${transaction.objectStoreNames[0]}, ${transaction.objectStoreNames[1]} store:`, event.target.error);
	};

	// maybe make a single table in indexdb
	// const objectStoreRequest = transaction.add(newItem[0]);
	// objectStoreRequest.onsuccess = (event) => {
	//   note.appendChild(createListItem('Request successful.'));
	//   t1.value,t2.value,t3.value = '';
	// };
});

async function display() {
	// First clear the content of the task list so that you don't get a huge long list of duplicate stuff each time
	// the display is updated.
	// while (cardHolder.firstChild) {
	//   cardHolder.removeChild(cardHolder.lastChild);
	// }

	const sentencesRequest = db.transaction("sentences", "readonly").objectStore("sentences").getAll();
	sentencesRequest.onsuccess = (event) => {
		// const cursor = event.target.result;
		const sentences = event.target.result;
		// Check if there are no (more) cursor items to iterate through
		// if (!cursor) {
		//   No more items to iterate through, we quit.
		// note.appendChild(createListItem('Entries all displayed.'));
		//   return;
		// }

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
	let showmore = 6; // Initial number of cards to display
	let totalCards = sol.length; // 0Keep track of the total number of cards displayed
	// if (totalCards + 10 < showmore) {//+10 never
	//   const showMoreButton = document.getElementById('showmore') || document.createElement('button');
	//   showMoreButton.textContent = 'Show More';
	//   showMoreButton.setAttribute('id', 'showmore');
	//   showMoreButton.setAttribute('class', 'btn-primary');
	//   showMoreButton.addEventListener('click', () => {
	//     showMoreCards(showMoreButton, sen, sol);
	//   });
	//   show.appendChild(showMoreButton);
	// }
	//   const transaction = db.transaction('sentences', 'readonly');
	//   const sentencesStore = transaction.objectStore('sentences');
	//   const request = sentencesStore.openCursor();
	//   request.onsuccess = (event) => {
	//     const cursor = event.target.result;
	//     if (cursor) {
	//       const card = document.createElement('div');
	//       card.classList.add('card');
	//       card.innerHTML = `
	//         <div class="card-body">
	//           <h5 class="card-title">${cursor.value.sentence}</h5>
	//           <p class="card-text">Solution goes here</p>
	//           <button class="btn btn-primary">Edit</button>
	//           <button class="btn btn-danger">Delete</button>
	//         </div>
	//       `;
	//       cardHolder.appendChild(card);
	//       cursor.continue();
	//     }
	//   };
	for (let i = 0; i < sen.length && totalCards < showmore; i++) {
		const card = document.createElement("div");
		card.classList.add("card", "bi", "bi-hand-index-fill");
		card.id = `card-${i / 2}`;
		const deleteButton = document.createElement("button");
		card.append(deleteButton);
		const heading = document.createElement("h2");
		heading.textContent = sen[i].sentence;
		const paragraph = document.createElement("p");
		if (i + 1 < sen.length) {
			paragraph.textContent = sen[i + 1].sentence;
			i++;
		}
		card.appendChild(heading);
		card.appendChild(paragraph);

		deleteButton.textContent = "X";
		deleteButton.setAttribute("class", "removebtn");
		deleteButton.onclick = (e) => {
			paragraph.parentNode.remove();
			console.log(" deleteItem(event);");
		};
		cardHolder.appendChild(card);
		totalCards++;
		card.addEventListener("click", () => {
			toggleCardContent(card);
		});
	}
}

async function toggleCardContent(card) {
	const [heading, paragraph] = [card.firstElementChild, card.lastElementChild];
	const cardIndex = parseInt(card.id.split("-")[1]);
	try {
		const dbTransaction = db.transaction("solutions", "readonly");
		const solutionsStore = dbTransaction.objectStore("solutions");
		const solutionRequest = solutionsStore.get(cardIndex + 1);
		solutionRequest.onsuccess = ({ target: { result: solution } }) => {
			paragraph.textContent = solution ? solution.solution : "";
		};
		solutionRequest.onerror = ({ target: { errorCode } }) => {
			console.error(`Error reading solution from database: ${errorCode}`);
		};
	} catch (error) {
		console.error("Error reading file:", error);
	}
}

// wipeData indexdb called via button onclick="wipeData()"
function wipeData() {
	const removeDataFromStore = (storeName) => {
		const transaction = db.transaction([storeName], "readwrite");
		const store = transaction.objectStore(storeName);

		const clearRequest = store.clear();

		// db = indexedDB.deleteDatabase("myDatabase");
		// db.onsuccess = () => {
		// 	console.log(`removed myDatabase `);
		// };

		clearRequest.onsuccess = () => {
			console.log(`Data removed from ${storeName} store successfully`);
		};

		clearRequest.onerror = (event) => {
			console.error(`Error removing data from ${storeName} store:`, event.target.error);
		};
	};
	removeDataFromStore("sentences");
	removeDataFromStore("solutions");

	const cards = document.querySelectorAll('[id^="card-"]');
	// [id^="card-"]  // [id$="-\\d"]
	if (cards.length >= 0) {
		cards.forEach((card) => card.remove());
		console.log(cards);
	}
	// const dataTask = event.target.getAttribute('data-task');
	// const transaction = db.transaction(['toDoList'], 'readwrite');
	// transaction.objectStore('toDoList').delete(dataTask);
}
// function remover(e){
//   e.target.remove();
// }
//////////////////////////////////////////////////////////////////////////
// showmore cards if indexdb is > than page displaying

// function createCard(sentences, index, displayviashowmore) {
//   const card = document.createElement('div');
//   card.classList.add('card', 'bi', 'bi-hand-index-fill');
//   card.id = `card-${index}`;
//   const heading = document.createElement('h2');
//   if (!displayviashowmore) {
//     heading.textContent = sentences[index];
//   }
//   const paragraph = document.createElement('p');
//   if (index + 1 < sentences.length) {
//     let k;
//     if (!displayviashowmore) { k = 1 } else { k = 0; }
//     paragraph.textContent = sentences[index + k];
//   }
//   card.addEventListener('click', () => {
//     toggleCardContent(card);
//   });
//   card.appendChild(heading);
//   card.appendChild(paragraph);
//   displayviashowmore = false;

//   return card;
// }
//////////////////////////////////////////////////////////////////////////
// function showMoreCards(showMoreBtn, sentences, solutions) {
//   const totalCards = document.querySelectorAll('.card').length;
//   console.log(solutions);

//   const cardsToShow = solutions.length + 1;
//   for (let i = totalCards; i < cardsToShow; i++) {
//     const displayviashowmore = true;
//     const card = createCard(sentences, i, displayviashowmore);
//     cardHolder.appendChild(card);
//     if (i + 1 < sentences.length) {
//       i++; // Increment i to skip the next sentence
//     }
//   }
//   toggleButton(showMoreBtn, cardsToShow, sentences.length);
// }
//////////////////////////////////////////////////////////////////////////
// function toggleButton(showMoreBtn, cardsToShow, sentencesLength) {
//   if (cardsToShow >= sentencesLength) {
//     showMoreBtn.classList.add('deactivated');
//     showMoreBtn.disabled = true;
//   } else {
//     showMoreBtn.classList.remove('deactivated');
//     showMoreBtn.disabled = false;
//   }
// }
//////////////////////////////////////////////////////////////////////////
// im unable to set ids from indexdb to 0 after a wipe
// somehow im unable select a simple #card-*, created with js, after dom reload
// if (true == false) {
//   const cards = document.querySelectorAll('[id^="card-"]');
//   // [id^="card-"]  // [id$="-\\d"]
//   console.log(cards.children);
// }

// function createListItem(contents) {
//   const listItem = document.createElement('li');
//   listItem.textContent = contents;
//   return listItem;
// };
//////////////////////////////////////////////////////////////////////////
