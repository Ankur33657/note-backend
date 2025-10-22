const { Server } = require("socket.io");
const Notes = require("../models/notes");

const InitializingSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: [process.env.FRONTEND_URL, "http://localhost:3000"],
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    },
  });

  io.on("connection", (socket) => {
    console.log("New WebSocket connection established!");

    // Automatically join feed room on connection
    socket.join("feed");
    console.log("User joined feed room");

    socket.on("joinRoom", ({ noteId }) => {
      if (!noteId) {
        console.log("Missing noteId for joining room.");
        return;
      }
      const room = noteId;
      console.log("Joining room:", room);
      socket.join(room);
    });

    socket.on(
      "editNote",
      async ({ noteId, heading, description, priority }) => {
        if (!noteId || !heading || !description || !priority) {
          console.log("Incomplete data received.");
          return;
        }

        try {
          const updatedNote = await Notes.findOneAndUpdate(
            { _id: noteId },
            {
              $set: {
                heading: heading,
                description: description,
                priority: priority,
              },
            },
            {
              new: true,
              runValidators: true,
            },
          );

          if (!updatedNote) {
            console.log("Note not found during update");
            socket.emit("editError", { error: "Note not found" });
            return;
          }

          io.to(noteId).emit("editNoterecieve", {
            noteId: noteId,
            heading: heading,
            description: description,
            priority: priority,
          });

          // Broadcast to feed room
          io.to("feed").emit("noteFeedUpdated", { noteId });
        } catch (err) {
          console.error("Error updating note:", err);
          socket.emit("editError", { error: err.message });
        }
      },
    );

    socket.on("taskAdded", ({ data }) => {
      console.log("📝 Task added event received:", data);

      io.to("feed").emit("taskAdded", { data });

      console.log("✅ Broadcasted taskAdded to all clients");
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected.");
    });
  });

  return io;
};

module.exports = InitializingSocket;
