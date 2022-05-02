const mongoose = require("mongoose");

const deckSchema = new mongoose.Schema({
  title: { type: String, required: true },
  cards: { type: [[String]] },
  owner: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "user" },
});

const Deck = mongoose.model("deck", deckSchema);

module.exports = Deck;
