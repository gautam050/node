const express = require('express');
const auth = require('../middleware/authMiddleware');
const { todos, nextId } = require('../store');

const router = express.Router();
router.use(auth);


router.post('/', (req, res) => {
  const { title, description, status } = req.body;

  if (!title) return res.status(400).json({ message: "title required" });

  const todo = {
    id: nextId(),
    userId: req.user.id,
    title,
    description: description || "",
    status: status || "todo"
  };

  todos.push(todo);
  res.status(201).json(todo);
});


router.get('/', (req, res) => {
  res.json(todos.filter(t => t.userId === req.user.id));
});


router.put('/:id', (req, res) => {
  const t = todos.find(todo => todo.id === req.params.id);

  if (!t) return res.status(404).json({ message: "not found" });
  if (t.userId !== req.user.id) return res.status(403).json({ message: "forbidden" });

  t.title = req.body.title ?? t.title;
  t.description = req.body.description ?? t.description;
  t.status = req.body.status ?? t.status;

  res.json(t);
});


router.delete('/:id', (req, res) => {
  const index = todos.findIndex(todo => todo.id === req.params.id);

  if (index === -1) return res.status(404).json({ message: "not found" });
  if (todos[index].userId !== req.user.id)
    return res.status(403).json({ message: "forbidden" });

  const removed = todos.splice(index, 1)[0];
  res.json(removed);
});

module.exports = router;
