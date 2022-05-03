const router = require("express").Router();
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");

const nameMaxLength = 20;

//register
router.post("/", async (req, res) => {
  try {
    const { firstName, lastName, email, password, passwordVerify } = req.body;

    // validation

    if (!firstName || !lastName || !email || !password || !passwordVerify) {
      return res
        .status(400)
        .json({ errorMessage: "Please enter all required fields." });
    }

    if (firstName.length > nameMaxLength || lastName.length > nameMaxLength) {
      return res.status(403).json({
        errorMessage: `First name and last name can't have more than ${nameMaxLength} characters.`,
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        errorMessage: "Please enter a password of at least 6 characters.",
      });
    }

    if (password !== passwordVerify) {
      return res
        .status(400)
        .json({ errorMessage: "Please enter the same password twice." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        errorMessage: "An account with this email already exists.",
      });
    }

    // hash the password

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    // save a new user account to the db

    const newUser = new User({
      firstName,
      lastName,
      email,
      passwordHash,
    });

    const savedUser = await newUser.save();

    // sign the token

    const token = jwt.sign(
      {
        _id: savedUser._id,
        firstName,
        lastName,
        email,
      },
      process.env.JWT_SECRET
    );

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

// log in

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ errorMessage: "Please enter all required fields." });
    }

    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      return res.status(401).json({ errorMessage: "Wrong email or password." });
    }

    const passwordCorrect = await bcrypt.compare(
      password,
      existingUser.passwordHash
    );

    if (!passwordCorrect) {
      return res.status(401).json({ errorMessage: "Wrong email or password." });
    }

    // sign the token

    const token = jwt.sign(
      {
        _id: existingUser._id,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        email: email,
      },
      process.env.JWT_SECRET
    );

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

// change account info
router.patch("/edit", auth, async (req, res) => {
  try {
    const { firstName, lastName } = req.body;

    if (!firstName.length || !lastName.length) {
      return res
        .status(400)
        .json({ errorMessage: "First name and last name can't be empty." });
    }

    if (firstName.length > nameMaxLength || lastName.length > nameMaxLength) {
      return res.status(403).json({
        errorMessage: `First name and last name can't have more than ${nameMaxLength} characters.`,
      });
    }

    const existingUser = await User.findById(req.user);
    if (!existingUser) {
      return res
        .status(404)
        .json({ errorMessage: "No user was found with this id" });
    }

    existingUser.firstName = firstName;
    existingUser.lastName = lastName;
    await existingUser.save();

    res.json({ successMessage: "Successfully updated." });
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

router.get("/loggedIn", (req, res) => {
  try {
    const token = req.header("x-auth-token");

    if (!token) {
      return res.json({ isLoggedIn: false });
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET);

    res.send({ isLoggedIn: true, user: verified });
  } catch (err) {
    res.json({ isLoggedIn: false });
  }
});

module.exports = router;
