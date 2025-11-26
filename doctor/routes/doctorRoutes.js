const express = require("express");
const router = express.Router();
const {
  createDoctor,
  getDoctorPatients,
  getDoctorConsultationCount,
  deleteDoctor
} = require("../controllers/doctorController");

router.post("/", createDoctor);
router.get("/:id/patients", getDoctorPatients);
router.get("/:id/consultations/count", getDoctorConsultationCount);
router.delete("/:id", deleteDoctor);

module.exports = router;
