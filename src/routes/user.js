const express = require("express");
const userRouter = express.Router();
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
userRouter.post("/signup", async (req, res) => {
  try {
    let { email, fullName, password } = req.body;
    if (!email || !fullName || !password)
      return res.status(400).json("Incorrect data");
    email = email.toLowerCase().trim();
    const ispresent = await User.findOne({
      email: email,
    });
    if (ispresent) return res.status(400).json("User already existed");
    const hashPassword = await bcrypt.hash(password, 12);
    const user = new User({
      email: email,
      fullName: fullName,
      password: hashPassword,
    });
    await user.save();
    res.status(200).json("User created successfully");
  } catch (err) {
    res.status(400).json("ERROR: " + err.message);
  }
});

userRouter.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;
    email = email.toLowerCase().trim();
    if (!email || !password) return res.status(400).json("Incorrect data");
    const user = await User.findOne({ email: email });
    if (!user) return res.status(400).json("Incorrect data");
    const isCorrectPassword = await bcrypt.compare(password, user.password);
    if (!isCorrectPassword) return res.status(400).json("Incorrect data");

    const token = await jwt.sign({ _id: user._id }, process.env.SECRET_KEY);
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      email: user.email,
      fullName: user.fullName,
    });
  } catch (err) {
    res.status(400).json("ERROR: " + err.message);
  }
});

userRouter.get("/logout", async (req, res) => {
  try {
    res
      .clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      })
      .json("Logout successfull");
  } catch (err) {
    res.status(400).json(err.message);
  }
});

module.exports = userRouter;
