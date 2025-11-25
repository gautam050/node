// server.js
const express = require("express");
const mongoose = require("mongoose");
const app = express();
app.use(express.json());

// ---------- Mongoose connection ----------
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bookrental";
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(()=> console.log("MongoDB connected"))
.catch(err => {
  console.error("MongoDB connection error:", err.message);
  process.exit(1);
});

// ---------- Schemas & Models ----------

// User Schema
const { Schema, model, Types } = mongoose;
const userSchema = new Schema({
  name: {
    type: String,
    required: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  rentedBooks: [{
    type: Types.ObjectId,
    ref: "Book"
  }]
}, { timestamps: true });

const User = model("User", userSchema);

// Book Schema
const bookSchema = new Schema({
  title: {
    type: String,
    required: true,
    minlength: 3
  },
  author: {
    type: String,
    required: true
  },
  genre: String,
  rentedBy: [{
    type: Types.ObjectId,
    ref: "User"
  }]
}, { timestamps: true });

const Book = model("Book", bookSchema);

// ---------- Routes ----------

// Add User
// POST /add-user
// body: { name, email }
app.post("/add-user", async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) return res.status(400).json({ error: "name and email required" });
    const user = new User({ name, email });
    await user.save();
    res.status(201).json({ message: "User created", user });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: "Email must be unique" });
    res.status(500).json({ error: err.message });
  }
});

// Add Book
// POST /add-book
// body: { title, author, genre? }
app.post("/add-book", async (req, res) => {
  try {
    const { title, author, genre } = req.body;
    if (!title || !author) return res.status(400).json({ error: "title and author required" });
    const book = new Book({ title, author, genre });
    await book.save();
    res.status(201).json({ message: "Book created", book });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rent Book
// POST /rent-book
// body: { userId, bookId }
app.post("/rent-book", async (req, res) => {
  try {
    const { userId, bookId } = req.body;
    if (!userId || !bookId) return res.status(400).json({ error: "userId and bookId required" });

    const user = await User.findById(userId);
    const book = await Book.findById(bookId);
    if (!user || !book) return res.status(404).json({ error: "User or Book not found" });

    // Avoid duplicates
    const userHas = user.rentedBooks.some(id => id.equals(book._id));
    const bookHas = book.rentedBy.some(id => id.equals(user._id));
    if (!userHas) user.rentedBooks.push(book._id);
    if (!bookHas) book.rentedBy.push(user._id);

    await user.save();
    await book.save();

    res.json({ message: "Book rented", user, book });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Return Book
// POST /return-book
// body: { userId, bookId }
app.post("/return-book", async (req, res) => {
  try {
    const { userId, bookId } = req.body;
    if (!userId || !bookId) return res.status(400).json({ error: "userId and bookId required" });

    const user = await User.findById(userId);
    const book = await Book.findById(bookId);
    if (!user || !book) return res.status(404).json({ error: "User or Book not found" });

    user.rentedBooks = user.rentedBooks.filter(id => !id.equals(book._id));
    book.rentedBy = book.rentedBy.filter(id => !id.equals(user._id));

    await user.save();
    await book.save();

    res.json({ message: "Book returned", user, book });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get User Rentals
// GET /user-rentals/:userId
// returns user and populated rentedBooks
app.get("/user-rentals/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).populate({
      path: "rentedBooks",
      select: "title author genre createdAt"
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Book Renters
// GET /book-renters/:bookId
// returns book and populated rentedBy
app.get("/book-renters/:bookId", async (req, res) => {
  try {
    const { bookId } = req.params;
    const book = await Book.findById(bookId).populate({
      path: "rentedBy",
      select: "name email createdAt"
    });
    if (!book) return res.status(404).json({ error: "Book not found" });
    res.json({ book });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Book
// PUT /update-book/:bookId
// body: { title?, author?, genre? }
app.put("/update-book/:bookId", async (req, res) => {
  try {
    const { bookId } = req.params;
    const update = {};
    const { title, author, genre } = req.body;
    if (title) update.title = title;
    if (author) update.author = author;
    if (genre !== undefined) update.genre = genre;

    const book = await Book.findByIdAndUpdate(bookId, update, { new: true, runValidators: true });
    if (!book) return res.status(404).json({ error: "Book not found" });
    res.json({ message: "Book updated", book });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Book
// DELETE /delete-book/:bookId
// Also remove this book from all users' rentedBooks arrays
app.delete("/delete-book/:bookId", async (req, res) => {
  try {
    const { bookId } = req.params;
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ error: "Book not found" });

    // Remove reference from all users
    await User.updateMany(
      { rentedBooks: book._id },
      { $pull: { rentedBooks: book._id } }
    );

    await book.remove();
    res.json({ message: "Book deleted and references removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List endpoints (simple)
app.get("/", (req, res) => {
  res.json({
    message: "Book Rental API",
    endpoints: [
      "POST /add-user",
      "POST /add-book",
      "POST /rent-book",
      "POST /return-book",
      "GET /user-rentals/:userId",
      "GET /book-renters/:bookId",
      "PUT /update-book/:bookId",
      "DELETE /delete-book/:bookId"
    ]
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`));
