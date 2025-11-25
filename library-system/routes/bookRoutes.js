const express = require("express");
const router = express.Router();
const { addBook, updateBook, deleteBook, getBookBorrowers } = require("../controllers/bookController");

router.post("/add-book", addBook);
router.put("/update-book/:bookId", updateBook);
router.delete("/delete-book/:bookId", deleteBook);
router.get("/book-borrowers/:bookId", getBookBorrowers);

module.exports = router;
