const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const userRouter = require("./routers/userRouter");
const deckRouter = require("./routers/deckRouter");

dotenv.config();

// set up server

const app = express();
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port: ${PORT}`));

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://memory-flashcard-app.netlify.app",
    ],
    credentials: true,
  })
);

// connect to mongoDB

mongoose.connect(process.env.MDB_CONNECT, (err) => {
  if (err) return console.error(err);
  console.log("Connected to mongoDB");
});

// set up routes

app.use("/auth", userRouter);
app.use("/deck", deckRouter);
