const path = require("path");

module.exports = {
	mode: "production",
	entry: { main: path.resolve(__dirname, "./public/clientserv2webpack.js") },
	output: {
		path: path.resolve(__dirname, "public"),
		filename: "[name].js",
    publicPath: '/' 
	},
	resolve: {
		modules: ["node_modules"],
	},
	externals: {
		"@simplewebauthn/browser": "SimpleWebAuthnBrowser",
	},
};
