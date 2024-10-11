const path = require("path");

module.exports = {
	mode: "development",
	entry: { main: path.resolve(__dirname, "./client.js") },
	output: {
		path: path.resolve(__dirname, "dist"),
		filename: "[name].js",
		// Path: path.resolve(__dirname, "dist"),
		// Filename: "[name].js",
	},
	resolve: {
		modules: ["node_modules"],
	},
};
