const Student = require("../models/Student");
const Enrollment = require("../models/Enrollment");

// CREATE STUDENT
exports.createStudent = async (req, res) => {
  try {
    const student = await Student.create(req.body);
    res.status(201).json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// SOFT DELETE STUDENT + CASCADE ENROLLMENTS
exports.deleteStudent = async (req, res) => {
  try {
    let id = req.params.id;

    await Student.findByIdAndUpdate(id, { isActive: false });

    await Enrollment.updateMany({ studentId: id }, { isActive: false });

    res.json({ message: "Student soft deleted and enrollments deactivated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET ACTIVE COURSES OF STUDENT
exports.getStudentCourses = async (req, res) => {
  try {
    const studentId = req.params.id;

    const data = await Enrollment.find({
      studentId,
      isActive: true
    }).populate({ path: "courseId", match: { isActive: true } });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
