const express = require('express');
const Note = require('../models/Note');
const auth = require('../middleware/authMiddleware');

const router = express.Router();


router.use(auth);


router.post('/', async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    const note = new Note({
      title,
      content: content || '',
      createdBy: req.user.id
    });
    await note.save();
    return res.status(201).json(note);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});


router.get('/', async (req, res) => {
  try {
    const notes = await Note.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    return res.json(notes);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});


router.put('/:id', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    if (note.createdBy.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden: not your note' });

    const { title, content } = req.body;
    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;

    await note.save();
    return res.json(note);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});


router.delete('/:id', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    if (note.createdBy.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden: not your note' });

    await note.remove();
    return res.json({ message: 'Note deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
