const mongoose = require("mongoose");
const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    serviceName: { type: String, required: true },
    requestedAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
    },
    notes: { type: String },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Booking", bookingSchema);
