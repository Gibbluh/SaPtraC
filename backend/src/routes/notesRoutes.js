const express = require("express");
const router = express.Router();
const { getAllNotes, getNoteById, createNote, deleteNote, updateNote } = require("../controllers/notesController.js");

router.get("/", getAllNotes);
router.get("/:id", getNoteById); // Add this line to handle GET requests for a specific note by ID
router.post("/", createNote);
router.put("/:id", updateNote); 
router.delete("/:id", deleteNote);  

module.exports = router;

