import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer } from "ws"; // Import WebSocketServer
import fs from "fs/promises";
import http from "http"; // Import http module
// import { Server } from "socket.io"; //socket.io
// Unchanged lines
// 	});
// });

// --- WebSocket Server Setup ---
const wss = new WebSocketServer({ server }); // Attach WebSocket server to the HTTP server
const clients = new Set(); // Keep track of connected clients

wss.on("connection", (ws) => {
	console.log("Client connected via WebSocket");
	clients.add(ws); // Add new client to the set

	// Send a welcome message or initial data if needed
	// ws.send(JSON.stringify({ type: 'info', message: 'Welcome to the chat!' }));

	ws.on("message", (message) => {
		console.log("Received message:", message.toString());
		// Broadcast the received message to all connected clients
		broadcast(message.toString(), ws); // Pass the sender to avoid echoing back to sender if desired
	});

	ws.on("close", () => {
		console.log("Client disconnected");
		clients.delete(ws); // Remove client from the set on disconnect
	});

	ws.on("error", (error) => {
		console.error("WebSocket error:", error);
		clients.delete(ws); // Remove client on error as well
	});
});

function broadcast(message, sender) {
	clients.forEach((client) => {
		// if (client !== sender && client.readyState === WebSocket.OPEN) { // Example: Don't send back to sender
		if (client.readyState === WebSocket.OPEN) {
			// Send to everyone including sender
			client.send(message);
		}
	});
}

// Start the server
server.listen(port, () => {
	console.log(`Server listening at http://localhost:${port}`);
});
