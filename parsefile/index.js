
const express = require("express");
const getFileInfo = require("./fileinfo");
const parseURL = require("./urlparser");

const app = express();


app.get("/", (req, res) => {
    res.send("root route is working!!");
});

app.get("/fileinfo", (req, res) => {
    const filepath = req.query.filepath;

    if (!filepath) {
        return res.status(400).send({ error: "filepath query param missing" });
    }

    const info = getFileInfo(filepath);
    res.send(info);
});


app.get("/parseurl", (req, res) => {
    const url = req.query.url;

    if (!url) {
        return res.status(400).send({ error: "url query param missing" });
    }

    const parsed = parseURL(url);
    res.send(parsed);
});


app.listen(3000, () => {
    console.log("Server running on port 3000 -> http://localhost:3000");
});

