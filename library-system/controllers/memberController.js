const Book = require("../models/Book");
const Member = require("../models/Member");

// Add Member
exports.addMember = async (req, res) => {
  try {
    const member = new Member(req.body);
    await member.save();
    res.json(member);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Borrow Book
exports.borrowBook = async (req, res) => {
  try {
    const { memberId, bookId } = req.body;

    const book = await Book.findById(bookId);
    const member = await Member.findById(memberId);

    if (book.status === "borrowed")
      return res.json({ message: "Book is already borrowed!" });

    book.status = "borrowed";
    book.borrowers.push(memberId);

    member.borrowedBooks.push(bookId);

    await book.save();
    await member.save();

    res.json({ message: "Book borrowed successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Return Book
exports.returnBook = async (req, res) => {
  try {
    const { memberId, bookId } = req.body;

    const book = await Book.findById(bookId);
    const member = await Member.findById(memberId);

    book.status = "available";
    book.borrowers.pull(memberId);

    member.borrowedBooks.pull(bookId);

    await book.save();
    await member.save();

    res.json({ message: "Book returned successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get Member Borrowed Books
exports.getMemberBorrowedBooks = async (req, res) => {
  try {
    const member = await Member.findById(req.params.memberId).populate("borrowedBooks");
    res.json(member);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
