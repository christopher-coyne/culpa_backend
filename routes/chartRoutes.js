const express = require("express");
const router = express.Router();
const fs = require("fs");

router.get("/", (req, res) => {
  try {
    fs.readFile("./data/scatterdatatotal.json", "utf8", function (err, data) {
      const data_json_scatter = JSON.parse(data);
      fs.readFile("./data/bardatatotal.json", "utf8", function (err, data2) {
        const data_json_bar = JSON.parse(data2);
        fs.readFile("./data/linedatatotal.json", "utf8", function (err, data3) {
          const data_json_line = JSON.parse(data3);
          res.json({
            scatter: data_json_scatter,
            bar: data_json_bar,
            line: data_json_line,
          });
        });
      });
    });
  } catch (e) {
    res.json({ serverError: e });
  }
});

module.exports = router;
