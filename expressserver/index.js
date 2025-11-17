
const express = require("express");

const app = express();

app.get("/", (req, res) => {
    res.send(`
        <h1>Welcome to the server</h1>
        <a href="/home">Home</a><br>
        <a href="/contactus">Contact Us</a>
    `);
});

app.get("/home", (req, res) => {
    res.send(`
        <h1>This is home page</h1>
        <a href="/">Go Back</a>
    `);
});

app.get("/contactus", (req, res) => {
    res.send(`
        <h1>Contact us at contact@contact.com</h1>
        <a href="/">Go Back</a>
    `);
});


app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});
