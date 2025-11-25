const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    minlength: 3
  },
  author: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["available", "borrowed"],
    default: "available"
  },
  borrowers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member"
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// PRE HOOK: Before saving, validate
bookSchema.pre("save", function (next) {
  if (this.title.length < 3) {
    return next(new Error("Title must be at least 3 characters"));
  }
  next();
});

// POST HOOK: After returning a book
bookSchema.post("save", function (doc) {
  console.log("Book updated:", doc.title);
});

module.exports = mongoose.model("Book", bookSchema);
