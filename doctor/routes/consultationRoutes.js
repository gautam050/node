const express = require("express");
const router = express.Router();
const {
  createConsultation,
  getRecentConsultations
} = require("../controllers/consultationController");

router.post("/", createConsultation);
router.get("/recent", getRecentConsultations);

module.exports = router;
