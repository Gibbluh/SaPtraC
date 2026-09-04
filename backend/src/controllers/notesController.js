const Note = require("../models/note.js");  
const mongoose = require("mongoose");

async function getAllNotes(_, res) {
  try {
    const notes = await Note.find().sort({ createdAt: -1 }); // Sort by creation date, newest first
    res.status(200).json(notes);
  } catch (error) {
    console.error("Error in getAllNotes controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function getNoteById(req, res) {  
    try {
        const { id } = req.params;
        console.log("Requested ID:", id);
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid note ID format" });
        }
        const note = await Note.findById(id);   
        if (!note) {
            return res.status(404).json({ message: "Note not found" });
        }               
        res.status(200).json(note);
    } catch (error) {
        console.error("Error in getNoteById controller", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

async function createNote(req, res) {
  try {
    console.log("Request body:", req.body); // Debug log
    const { title, content } = req.body;
    const note = new Note({ title, content });
    const savedNote= await note.save();
    res.status(201).json(savedNote);
  } catch (error) {
    console.error("Error in createNote controller", error);
    res.status(500).json({ message: "Internal server error", error: error.message }); // Send error message for debugging
  }
}

async function updateNote(req, res) {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const updatedNote = await Note.findByIdAndUpdate(id, { title, content }, { new: true });
    if (!updatedNote) {
      return res.status(404).json({ message: "Note not found" });
    }
    res.status(200).json(updatedNote);
  } catch (error) {
    console.error("Error in updateNote controller", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}

async function deleteNote(req, res) {
  try {
    const { id } = req.params;
    const deletedNote = await Note.findByIdAndDelete(id);
    if (!deletedNote) {
      return res.status(404).json({ message: "Note not found" });
    }
    res.status(200).json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("Error in deleteNote controller", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}

module.exports = {
    getAllNotes,
    getNoteById,
    createNote,
    updateNote,
    deleteNote
};