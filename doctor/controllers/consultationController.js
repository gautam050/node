const Consultation = require("../models/Consultation");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");


exports.createConsultation = async (req, res) => {
  try {
    const { doctorId, patientId } = req.body;

    const doctor = await Doctor.findById(doctorId);
    const patient = await Patient.findById(patientId);

    if (!doctor || !doctor.isActive)
      return res.status(400).json({ error: "Doctor is not active" });

    if (!patient || !patient.isActive)
      return res.status(400).json({ error: "Patient is not active" });

    const consultation = await Consultation.create(req.body);

    res.status(201).json(consultation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getRecentConsultations = async (req, res) => {
  try {
    const data = await Consultation.find({ isActive: true })
      .sort({ consultedAt: -1 })
      .limit(5)
      .populate("doctorId patientId");

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
