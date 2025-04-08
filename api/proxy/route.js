const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());

app.get("/proxy", async (req, res) => {
    const apiUrl = "https://www.yomama-jokes.com/api/v1/jokes/random/";
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
      return  res.json(data);
    } catch (error) {
        res.status(500).send("Error fetching data");
    }
});
app.get("/proxxy", async (req, res) => {
    const apiUrl = "https://evilinsult.com/generate_insult.php?lang=en&type=json";
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
      return  res.json(data);
    } catch (error) {
        res.status(500).send("Error fetching data");
    }
});

app.listen(3000, () => console.log("Proxy server running on port 3000"));
