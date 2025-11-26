const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");

// CREATE COURSE
exports.createCourse = async (req, res) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// SOFT DELETE COURSE + CASCADE ENROLLMENTS
exports.deleteCourse = async (req, res) => {
  try {
    let id = req.params.id;

    await Course.findByIdAndUpdate(id, { isActive: false });

    await Enrollment.updateMany({ courseId: id }, { isActive: false });

    res.json({ message: "Course soft deleted and enrollments deactivated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET ACTIVE STUDENTS OF COURSE
exports.getCourseStudents = async (req, res) => {
  try {
    const courseId = req.params.id;

    const data = await Enrollment.find({
      courseId,
      isActive: true
    }).populate({ path: "studentId", match: { isActive: true } });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
