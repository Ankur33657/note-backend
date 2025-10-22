const express = require("express");
const notesRouter = express.Router();
const Notes = require("../models/notes");
const { UserAuth } = require("../middleware/auth");
const { AdminAccess } = require("../middleware/accessUser");

notesRouter.get("/", UserAuth, async (req, res) => {
  try {
    const notes = await Notes.find({ createdBy: req.user._id });
    res.status(200).json(notes);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

notesRouter.post("/addnote", UserAuth, async (req, res) => {
  try {
    const { heading, description, priority } = req.body;
    const note = new Notes({
      heading: heading,
      createrName: req.user.fullName,
      description: description,
      priority: priority,
      createdBy: req.user._id,
    });
    await note.save();
    res.status(201).json(note);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

notesRouter.delete(
  "/deletenote/:id",
  UserAuth,
  AdminAccess,
  async (req, res) => {
    try {
      const noteId = req.params.id;

      if (req.adminAccess === true) {
        const note = await Notes.findByIdAndDelete(noteId);

        if (!note) {
          return res.status(404).json({ error: "Note not found" });
        }

        res
          .status(200)
          .json({ message: "Note deleted successfully", deletedNote: note });
      } else {
        res.status(403).json({ error: "Admin access required" });
      }
    } catch (err) {
      if (err.name === "CastError") {
        return res.status(400).json({ error: "Invalid Note ID format." });
      }

      console.error("Error deleting note:", err);
      res.status(500).json({ error: "Internal server error during deletion." });
    }
  },
);

notesRouter.get("/note-feed", UserAuth, async (req, res) => {
  try {
    const notes = await Notes.find({
      $and: [
        { createdBy: { $ne: req.userId } },

        {
          $or: [{ isPublic: true }, { privateAccess: req.userId }],
        },
      ],
    });
    res.status(200).json(notes);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

notesRouter.get("/note-save", UserAuth, async (req, res) => {
  try {
    const notes = await Notes.find({ saved: req.user._id });
    res.status(200).json(notes);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

notesRouter.post("/addComment", UserAuth, async (req, res) => {
  try {
    const { noteId, message } = req.body;

    const note = await Notes.findById(noteId);
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    const newComment = {
      createdBy: req.user._id,
      message: message,
    };

    const updatedNote = await Notes.findOneAndUpdate(
      { _id: noteId },
      { $push: { comments: newComment } },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedNote) {
      return res.status(404).json({ error: "Note not found during update" });
    }
    res.status(201).json({
      message: "Comment added successfully",
      comment: newComment,
    });
  } catch (err) {
    const statusCode = err.name === "ValidationError" ? 400 : 500;
    res.status(statusCode).json({ error: err.message });
  }
});

notesRouter.post("/comment-reaction", UserAuth, async (req, res) => {
  try {
    const { noteId, commentId, like, dislike } = req.body;
    const note = await Notes.findById(noteId);
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    const comment = note.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    if (like) {
      comment.likes += 1;
    } else if (dislike) {
      comment.dislikes += 1;
    }

    const updatedNote = await Notes.findOneAndUpdate(
      { _id: noteId },
      { $set: { comments: note.comments } },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedNote) {
      return res.status(404).json({ error: "Note not found during update" });
    }
    res.status(200).json({
      message: "Reaction added successfully",
      comment: comment,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

notesRouter.get("/note-details/:id", UserAuth, async (req, res) => {
  try {
    const note = await Notes.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }
    res.status(200).json({
      message: "Note details fetched successfully",
      note: note,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

notesRouter.post("/note-public/:id", UserAuth, async (req, res) => {
  try {
    const updatedNote = await Notes.findOneAndUpdate(
      { _id: req.params.id },
      { $set: { isPublic: true } },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedNote) {
      return res.status(404).json({ error: "Note not found during update" });
    }
    res.status(200).json({
      message: "Note made public successfully",
      note: updatedNote,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// notesRouter.post("/edit-note/:id", UserAuth, async (req, res) => {
//   try {
//     const updatedNote = await Notes.findOneAndUpdate(
//       { _id: req.params.id },
//       {
//         $set: {
//           heading: req.body.heading,
//           description: req.body.description,
//           priority: req.body.priority,
//         },
//       },
//       {
//         new: true,
//         runValidators: true,
//       },
//     );

//     if (!updatedNote) {
//       return res.status(404).json({ error: "Note not found during update" });
//     }
//     res.status(200).json({
//       message: "Note edited successfully",
//       note: updatedNote,
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });
module.exports = notesRouter;
