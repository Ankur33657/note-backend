const express = require("express");
const userRouter = require("./src/routes/user");
const notesRouter = require("./src/routes/notes");
const http = require("http");
const cors = require("cors");
const InitializingSocket = require("./src/utils/socket");
require("dotenv").config();
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const app = express();

app.use(
  cors({
    origin: [process.env.FRONTEND_URL, "http://localhost:3000"],
    credentials: true,

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);
app.use(cookieParser());
app.use(express.json());

const server = http.createServer(app);
InitializingSocket(server);

app.use("/api", userRouter);
app.use("/api/notes", notesRouter);
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    server.listen(process.env.PORT, () => {
      console.log("server listen");
    });
  })
  .catch((err) => {
    console.log(err.message);
  });
