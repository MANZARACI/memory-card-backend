const router = require("express").Router();
const Deck = require("../models/deckModel");
const User = require("../models/userModel");
const auth = require("../middleware/auth");

const cardMaxLength = 30;
const titleMaxLength = 30;
const maxDeckCount = 10;

// create a deck
router.post("/", auth, async (req, res) => {
  try {
    const { title } = req.body;
    const owner = req.user;

    const newDeck = new Deck({
      title,
      owner,
    });

    if (title.length > titleMaxLength) {
      return res.status(403).json({
        errorMessage: `Title can't have more than ${titleMaxLength} characters.`,
      });
    }

    const existingUser = await User.findOne({ _id: owner });

    if (existingUser.decks.length === maxDeckCount) {
      return res.status(403).json({
        errorMessage: `You can't exceed the limit of ${maxDeckCount} decks.`,
      });
    }

    const savedDeck = await newDeck.save();

    existingUser.decks.push(savedDeck._id);
    await existingUser.save();

    res.json(savedDeck);
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

// find decks by userId
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const existingUser = await User.findById(userId).populate("decks");
    if (!existingUser) {
      return res
        .status(404)
        .json({ errorMessage: "No user was found with this id" });
    }

    res.json(existingUser.decks);
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

// find deck by deckId
router.get("/:deckId", async (req, res) => {
  try {
    const { deckId } = req.params;

    if (deckId.length !== 24) {
      return res
        .status(403)
        .json({ errorMessage: "The deck Id must be 24 characters long." });
    }

    const existingDeck = await Deck.findOne({ _id: deckId });

    if (!existingDeck) {
      return res
        .status(404)
        .json({ errorMessage: "No deck was found with this id." });
    }

    res.json(existingDeck);
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

// add a card to a deck
router.patch("/:deckId", auth, async (req, res) => {
  try {
    const { deckId } = req.params;
    const { card } = req.body;

    if (!Array.isArray(card) || card.length !== 2) {
      return res.status(403).json({
        errorMessage: "At least 2 text inputs must be given to add a card.",
      });
    }

    if (card[0].length === 0 || card[1].length === 0) {
      return res
        .status(403)
        .json({ errorMessage: "Card sides can't be empty." });
    }

    if (card[0].length > cardMaxLength || card[1].length > cardMaxLength) {
      return res.status(403).json({
        errorMessage: `Card sides can't have more than ${cardMaxLength} characters.`,
      });
    }

    const existingDeck = await Deck.findOne({ _id: deckId });

    if (!existingDeck) {
      return res
        .status(404)
        .json({ errorMessage: "No deck was found with this id." });
    }

    if (!existingDeck.owner.equals(req.user)) {
      return res.status(401).json({ errorMessage: "Unauthorized" });
    }

    existingDeck.cards.push(card);
    await existingDeck.save();
    res.json(existingDeck);
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

// update deck title
router.patch("/:deckId/title", auth, async (req, res) => {
  try {
    const { deckId } = req.params;
    const { newTitle } = req.body;

    if (newTitle.length > titleMaxLength) {
      return res.status(403).json({
        errorMessage: `Title can't have more than ${titleMaxLength} characters.`,
      });
    }

    const existingDeck = await Deck.findOne({ _id: deckId });

    if (!existingDeck) {
      return res
        .status(404)
        .json({ errorMessage: "No deck was found with this id." });
    }

    if (!existingDeck.owner.equals(req.user)) {
      return res.status(401).json({ errorMessage: "Unauthorized" });
    }

    existingDeck.title = newTitle;
    await existingDeck.save();
    res.json(existingDeck);
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

// edit a card
router.patch("/:deckId/:cardNo", auth, async (req, res) => {
  try {
    const { deckId, cardNo } = req.params;
    const { card } = req.body;

    const existingDeck = await Deck.findOne({ _id: deckId });

    if (!existingDeck) {
      return res
        .status(404)
        .json({ errorMessage: "No deck was found with this id." });
    }

    if (!existingDeck.owner.equals(req.user)) {
      return res.status(401).json({ errorMessage: "Unauthorized" });
    }

    if (cardNo < 0 || cardNo > existingDeck.cards.length - 1) {
      return res.status(404).json({
        errorMessage: "No card was found with this card number",
      });
    }

    if (card[0].length > cardMaxLength || card[1].length > cardMaxLength) {
      return res.status(403).json({
        errorMessage: `Card sides can't have more than ${cardMaxLength} characters.`,
      });
    }

    existingDeck.cards[cardNo] = card;
    await existingDeck.save();
    res.json(existingDeck);
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

// remove a card from a deck
router.delete("/:deckId/:cardNo", auth, async (req, res) => {
  try {
    const { deckId, cardNo } = req.params;

    const existingDeck = await Deck.findOne({ _id: deckId });

    if (!existingDeck) {
      return res
        .status(404)
        .json({ errorMessage: "No deck was found with this id." });
    }

    if (!existingDeck.owner.equals(req.user)) {
      return res.status(401).json({ errorMessage: "Unauthorized" });
    }

    if (cardNo < 0 || cardNo > existingDeck.cards.length - 1) {
      return res.status(404).json({
        errorMessage: "No card was found with this card number",
      });
    }

    existingDeck.cards.splice(cardNo, 1);
    await existingDeck.save();
    res.json(existingDeck);
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

// delete a deck
router.delete("/:deckId", auth, async (req, res) => {
  try {
    const { deckId } = req.params;

    const existingDeck = await Deck.findOne({ _id: deckId });

    if (!existingDeck) {
      return res
        .status(404)
        .json({ errorMessage: "No deck was found with this id." });
    }

    if (!existingDeck.owner.equals(req.user)) {
      return res.status(401).json({ errorMessage: "Unauthorized" });
    }

    const owner = await User.findById(req.user);

    const index = owner.decks.indexOf(deckId);
    owner.decks.splice(index, 1);

    await Deck.findByIdAndDelete({ _id: deckId });
    await owner.save();

    res.json({ successMessage: "Successfully deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

// check if deck owner for editing a deck
router.get("/:deckId/isOwner", auth, async (req, res) => {
  try {
    const { deckId } = req.params;

    const existingDeck = await Deck.findOne({ _id: deckId });

    if (!existingDeck) {
      return res.json({ errorMessage: "No deck was found with this id." });
    }

    res.json(existingDeck.owner.equals(req.user));
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

module.exports = router;
