const express = require("express");
const router = express.Router();
const controller = require("../controllers/user.controller");

router.post("/users", controller.createUser);
router.post("/users/:userId/address", controller.addAddress);
router.get("/users/summary", controller.getSummary);
router.get("/users/:userId", controller.getUserDetails);

module.exports = router;
