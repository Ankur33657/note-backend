const express = require("express");
const userRouter = require("./src/routes/user");
const notesRouter = require("./src/routes/notes");
const http = require("http");
const cors = require("cors");

require("dotenv").config();
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const app = express();
app.use(cookieParser());

app.use(express.json());

app.use(
  cors({
    origin: [process.env.FRONTEND_URL, "http://localhost:3000"],
    credentials: true,

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);

app.use("/api", userRouter);
app.use("/api/notes", notesRouter);
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log("server listen");
    });
  })
  .catch((err) => {
    console.log(err.message);
  });
