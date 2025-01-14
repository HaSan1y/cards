/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./dist/clientserv2webpack.js":
/*!************************************!*\
  !*** ./dist/clientserv2webpack.js ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _simplewebauthn_browser__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @simplewebauthn/browser */ \"@simplewebauthn/browser\");\n/* harmony import */ var _simplewebauthn_browser__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_simplewebauthn_browser__WEBPACK_IMPORTED_MODULE_0__);\n// import { startAuthentication, startRegistration } from \"@simplewebauthn/browser@10.0.0/dist/bundle/index.umd.min.js\";\r\n\r\n// import { startAuthentication, startRegistration } from \"https://cdn.jsdelivr.net/npm/@simplewebauthn/browser@10.0.0/dist/bundle/index.umd.min.js\";\r\nconsole.log(\"Script loaded\"); // This should appear when the page loads\r\n\r\nconst emailInput = document.querySelector(\"[data-email]\");\r\nconst modal = document.querySelector(\"[data-modal]\");\r\nconst closeButton = document.querySelector(\"[data-close]\");\r\ndocument.addEventListener(\"DOMContentLoaded\", function () {\r\n\tconsole.log(\"DOM fully loaded\");\r\n\r\n\tconst form = document.getElementById(\"authForm\");\r\n\tconst submitButton = document.getElementById(\"submitButton\");\r\n\tconsole.log(\"Form element:\", form);\r\n\tconsole.log(\"Submit button:\", submitButton);\r\n\r\n\tif (submitButton) {\r\n\t\tsubmitButton.addEventListener(\"click\", async (e) => {\r\n\t\t\te.preventDefault();\r\n\t\t\tconsole.log(\"Form submitted\");\r\n\r\n\t\t\tif (submitButton.hasAttribute(\"data-login\")) {\r\n\t\t\t\tconsole.log(\"Login attempt\");\r\n\t\t\t\tawait login();\r\n\t\t\t} else if (submitButton.hasAttribute(\"data-signup\")) {\r\n\t\t\t\tconsole.log(\"Signup attempt\");\r\n\t\t\t\tawait signup();\r\n\t\t\t} else {\r\n\t\t\t\tconsole.log(\"Button has neither data-login nor data-signup attribute\");\r\n\t\t\t}\r\n\t\t});\r\n\t} else {\r\n\t\tconsole.error(\"Form element not found\");\r\n\t}\r\n});\r\ncloseButton.addEventListener(\"click\", () => modal.close());\r\n\r\nconst SERVER_URL = \"https://db-2-cards.vercel.app\"; //http://localhost:3000\";\r\n\r\nasync function signup() {\r\n\tconsole.log(\"Signup function called\");\r\n\ttry {\r\n\t\tconst email = document.querySelector(\"[data-email]\").value;\r\n\t\tconsole.log(\"Registering with email:\", email);\r\n\r\n\t\t// 1. Get challenge from server\r\n\t\tconst initResponse = await fetch(`${SERVER_URL}/init-register?email=${email}`, { credentials: \"include\" });\r\n\t\tif (!initResponse.ok) {\r\n\t\t\tthrow new Error(`HTTP error! status: ${initResponse.status}`);\r\n\t\t\t// showModalText(options.error);\r\n\t\t}\r\n\t\tconst options = await initResponse.json();\r\n\t\tconsole.log(\"Server response:\", options);\r\n\t\t// 2. Create passkey\r\n\t\tconst registrationJSON = await (0,_simplewebauthn_browser__WEBPACK_IMPORTED_MODULE_0__.startRegistration)(options);\r\n\t\tconsole.log(\"Registration JSON:\", registrationJSON);\r\n\r\n\t\t// 3. Save passkey in DB\r\n\t\tconst verifyResponse = await fetch(`${SERVER_URL}/verify-register`, {\r\n\t\t\tcredentials: \"include\",\r\n\t\t\tmethod: \"POST\",\r\n\t\t\theaders: {\r\n\t\t\t\t\"Content-Type\": \"application/json\",\r\n\t\t\t},\r\n\t\t\tbody: JSON.stringify(registrationJSON),\r\n\t\t});\r\n\r\n\t\tconst verifyData = await verifyResponse.json();\r\n\t\tif (!verifyResponse.ok) {\r\n\t\t\tshowModalText(verifyData.error);\r\n\t\t}\r\n\t\tif (verifyData.verified) {\r\n\t\t\tshowModalText(`Successfully registered ${email}`);\r\n\t\t} else {\r\n\t\t\tshowModalText(`Failed to register`);\r\n\t\t}\r\n\t} catch (error) {\r\n\t\tconsole.error(\"Signup error:\", error);\r\n\t}\r\n}\r\n\r\nasync function login() {\r\n\tconsole.log(\"Login function called\");\r\n\ttry {\r\n\t\tconst usernameInput = document.getElementById(\"username\");\r\n\t\tconst username = usernameInput.value;\r\n\t\tconsole.log(\"Attempting to log in with username:\", username);\r\n\t\tif (!username) {\r\n\t\t\tshowModalText(\"Please enter a username\");\r\n\t\t\treturn;\r\n\t\t}\r\n\r\n\t\t// 1. Get challenge from server\r\n\t\tconst initResponse = await fetch(`${SERVER_URL}/init-auth?username=${username}`, {\r\n\t\t\tcredentials: \"include\",\r\n\t\t});\r\n\t\tif (!initResponse.ok) {\r\n\t\t\tconst errorData = await initResponse.json();\r\n\t\t\tthrow new Error(errorData.error || `HTTP error! status: ${initResponse.status}`);\r\n\r\n\t\t\t// showModalText(options.error);\r\n\t\t}\r\n\t\tconst options = await initResponse.json();\r\n\r\n\t\t// 2. Get passkey\r\n\t\tconst authJSON = await (0,_simplewebauthn_browser__WEBPACK_IMPORTED_MODULE_0__.startAuthentication)(options);\r\n\r\n\t\t// 3. Verify passkey with DB\r\n\t\tconst verifyResponse = await fetch(`${SERVER_URL}/verify-auth`, {\r\n\t\t\tcredentials: \"include\",\r\n\t\t\tmethod: \"POST\",\r\n\t\t\theaders: {\r\n\t\t\t\t\"Content-Type\": \"application/json\",\r\n\t\t\t},\r\n\t\t\tbody: JSON.stringify(authJSON),\r\n\t\t});\r\n\r\n\t\tconst verifyData = await verifyResponse.json();\r\n\t\tif (!verifyResponse.ok) {\r\n\t\t\tthrow new Error(verifyData.error || \"Verification failed\");\r\n\t\t\t// showModalText(verifyData.error);\r\n\t\t}\r\n\t\tif (verifyData.verified) {\r\n\t\t\tshowModalText(`Successfully logged in ${username}`);\r\n\t\t} else {\r\n\t\t\tshowModalText(`Failed to log in`);\r\n\t\t}\r\n\t} catch (error) {\r\n\t\tconsole.error(\"Login error:\", error);\r\n\t\t// showModalText(error.message);\r\n\t}\r\n}\r\n\r\nfunction showModalText(text) {\r\n\tmodal.querySelector(\"[data-content]\").innerText = text;\r\n\tmodal.showModal();\r\n}\r\n\n\n//# sourceURL=webpack://crud-cards/./dist/clientserv2webpack.js?");

/***/ }),

/***/ "@simplewebauthn/browser":
/*!******************************************!*\
  !*** external "@simplewebauthn/browser" ***!
  \******************************************/
/***/ ((module) => {

module.exports = require("@simplewebauthn/browser");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./dist/clientserv2webpack.js");
/******/ 	
/******/ })()
;