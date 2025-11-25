const Book = require("../models/Book");
const Member = require("../models/Member");

exports.addBook = async (req, res) => {
  try {
    const { title, author } = req.body;
    const book = new Book({ title, author });
    await book.save();
    res.json(book);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(
      req.params.bookId,
      req.body,
      { new: true }
    );
    res.json(book);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.bookId);

    if (!book) return res.json({ message: "Book not found" });

    await Member.updateMany(
      { borrowedBooks: book._id },
      { $pull: { borrowedBooks: book._id } }
    );

    await Book.findByIdAndDelete(req.params.bookId);

    res.json({ message: "Book deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getBookBorrowers = async (req, res) => {
  try {
    const book = await Book.findById(req.params.bookId).populate("borrowers");
    res.json(book);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
