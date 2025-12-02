const Booking = require("../models/Booking");
exports.createBooking = async (req, res) => {
  try {
    const { serviceName, requestedAt, notes } = req.body;
    if (!serviceName || !requestedAt)
      return res.status(400).json({ message: "Missing fields" });
    const booking = await Booking.create({
      user: req.user._id,
      serviceName,
      requestedAt: new Date(requestedAt),
      notes,
    });
    return res.status(201).json({ booking });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
exports.getBookings = async (req, res) => {
  try {
    if (req.user.role === "admin") {
      const all = await Booking.find().populate("user", "username email role");
      return res.json({ bookings: all });
    }
    const mine = await Booking.find({ user: req.user._id });
    return res.json({ bookings: mine });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
exports.updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Forbidden" });
    if (booking.status !== "pending")
      return res
        .status(400)
        .json({ message: "Only pending bookings can be updated" });
    const { serviceName, requestedAt, notes } = req.body;
    if (serviceName) booking.serviceName = serviceName;
    if (requestedAt) booking.requestedAt = new Date(requestedAt);
    if (notes) booking.notes = notes;
    await booking.save();
    return res.json({ booking });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Forbidden" });
    if (booking.status !== "pending")
      return res
        .status(400)
        .json({ message: "Only pending bookings can be cancelled" });
    booking.status = "cancelled";
    await booking.save();
    return res.json({ booking });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
exports.approveBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.status !== "pending")
      return res
        .status(400)
        .json({ message: "Only pending bookings can be approved" });
    booking.status = "approved";
    await booking.save();
    return res.json({ booking });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
exports.rejectBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.status !== "pending")
      return res
        .status(400)
        .json({ message: "Only pending bookings can be rejected" });
    booking.status = "rejected";
    await booking.save();
    return res.json({ booking });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    await booking.deleteOne();
    return res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
