const express = require("express");
const router = express.Router();
const controller = require("../controllers/user.controller");

router.post("/add-user", controller.addUser);
router.post("/add-profile/:userId", controller.addProfile);
router.get("/get-users", controller.getUsers);
router.get("/search", controller.search);
router.put("/update-profile/:userId/:profileName", controller.updateProfile);
router.delete("/delete-profile/:userId/:profileName", controller.deleteProfile);

module.exports = router;
