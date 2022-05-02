const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  decks: [{ type: mongoose.Schema.Types.ObjectId, ref: "deck" }],
});

const User = mongoose.model("user", userSchema);

module.exports = User;
