const Enrollment = require("../models/Enrollment");
const Student = require("../models/Student");
const Course = require("../models/Course");

// ENROLL API
exports.enrollStudent = async (req, res) => {
  try {
    const { studentId, courseId } = req.body;

    const student = await Student.findById(studentId);
    const course = await Course.findById(courseId);

    if (!student || !student.isActive)
      return res.status(400).json({ error: "Student is not active" });

    if (!course || !course.isActive)
      return res.status(400).json({ error: "Course is not active" });

    const enrollment = await Enrollment.create({ studentId, courseId });

    res.status(201).json(enrollment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
