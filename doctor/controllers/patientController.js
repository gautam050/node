const Patient = require("../models/Patient");
const Consultation = require("../models/Consultation");


exports.createPatient = async (req, res) => {
  try {
    const patient = await Patient.create(req.body);
    res.status(201).json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPatientDoctors = async (req, res) => {
  try {
    const patientId = req.params.id;

    const consultations = await Consultation.find({
      patientId,
      isActive: true
    })
      .populate({
        path: "doctorId",
        match: { isActive: true },
        select: "name specialization"
      });

    res.json(consultations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getPatientsByGender = async (req, res) => {
  try {
    const gender = req.query.gender;

    const patients = await Patient.find({
      gender,
      isActive: true
    });

    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deletePatient = async (req, res) => {
  try {
    const patientId = req.params.id;

    await Patient.findByIdAndUpdate(patientId, { isActive: false });

    await Consultation.updateMany({ patientId }, { isActive: false });

    res.json({ message: "Patient and related consultations deactivated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
