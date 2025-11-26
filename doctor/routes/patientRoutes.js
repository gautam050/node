const express = require("express");
const router = express.Router();
const {
  createPatient,
  getPatientDoctors,
  getPatientsByGender,
  deletePatient
} = require("../controllers/patientController");

router.post("/", createPatient);
router.get("/:id/doctors", getPatientDoctors);
router.get("/", getPatientsByGender);
router.delete("/:id", deletePatient);

module.exports = router;
