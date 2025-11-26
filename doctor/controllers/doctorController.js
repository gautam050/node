const Doctor = require("../models/Doctor");
const Consultation = require("../models/Consultation");


exports.createDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.create(req.body);
    res.status(201).json(doctor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getDoctorPatients = async (req, res) => {
  try {
    const doctorId = req.params.id;

    const consultations = await Consultation.find({
      doctorId,
      isActive: true
    })
      .populate({
        path: "patientId",
        match: { isActive: true },
        select: "name age gender"
      })
      .sort({ consultedAt: -1 })
      .limit(10);

    res.json(consultations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getDoctorConsultationCount = async (req, res) => {
  try {
    const doctorId = req.params.id;

    const count = await Consultation.countDocuments({
      doctorId,
      isActive: true
    });

    res.json({ totalConsultations: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteDoctor = async (req, res) => {
  try {
    const doctorId = req.params.id;

    await Doctor.findByIdAndUpdate(doctorId, { isActive: false });

    await Consultation.updateMany({ doctorId }, { isActive: false });

    res.json({ message: "Doctor and related consultations deactivated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
