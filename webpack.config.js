const path = require("path");

module.exports = {
	mode: "development",
	entry: { main: path.resolve(__dirname, "./dist/clientserv2webpack.js") },
	output: {
		path: path.resolve(__dirname, "dist"),
		filename: "[name].js",
	},
	resolve: {
		modules: ["node_modules"],
	},
};
