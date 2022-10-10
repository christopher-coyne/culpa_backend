const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");

router.get(
  "/",
  asyncHandler(async (req, res, next) => {
    res.json({ res: "hello world" });
    console.log("sending test...");
  })
);

module.exports = router;
