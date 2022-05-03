const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  try {
    const token = req.header("x-auth-token");

    if (!token) {
      return res.status(401).send({ errorMessage: "Unauthorized" });
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET);

    req.user = verified._id;

    next();
  } catch (err) {
    console.error(err);
    res.status(401).send({ errorMessage: "Unauthorized" });
  }
};

module.exports = auth;
