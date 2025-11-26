const express = require("express");
const router = express.Router();
const { enrollStudent } = require("../controllers/enrollmentController");

router.post("/", enrollStudent);

module.exports = router;
