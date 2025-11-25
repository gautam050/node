const express = require("express");
const router = express.Router();

const {
  addMember,
  borrowBook,
  returnBook,
  getMemberBorrowedBooks
} = require("../controllers/memberController");

router.post("/add-member", addMember);
router.post("/borrow-book", borrowBook);
router.post("/return-book", returnBook);
router.get("/member-borrowed-books/:memberId", getMemberBorrowedBooks);

module.exports = router;
