const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const format = require("pg-format");
const client = require("../config/connection");

router.get(
  "/:term",
  asyncHandler(async (req, res, next) => {
    try {
      const sql = format(
        "SELECT courses.name AS name, courses.course_id AS id, 'course' as type FROM courses WHERE courses.name LIKE '%%%s%%' UNION ALL SELECT professors.name, professors.prof_id, professors.nugget FROM professors WHERE professors.name LIKE '%%%s%%';",
        req.params.term,
        req.params.term
      );

      const result = await client.query(sql);
      res.json({ results: result.rows });
    } catch (e) {
      res.json({ serverError: e });
    }
  })
);

module.exports = router;
