const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const format = require("pg-format");
const client = require("../config/connection");

router.get(
  "/name/:term",
  asyncHandler(async (req, res, next) => {
    try {
      const sql = format(
        "SELECT courses.name, courses.course_id FROM courses WHERE courses.name LIKE '%%%s%%%';",
        req.params.term
      );
      const result = await client.query(sql);
      res.json({ results: result.rows });
    } catch (e) {
      res.json({ serverError: e });
    }
  })
);

router.get(
  "/reviews/:term",
  asyncHandler(async (req, res, next) => {
    // return professor info, the reviews, and the names of the courses,
    const reviews_sql = format(
      "SELECT reviews.agree, reviews.disagree, reviews.content, reviews.workload, reviews.date, reviews.review_id, professors.name, professors.prof_id from reviews INNER JOIN professors ON professors.prof_id = reviews.prof_id WHERE reviews.course_id = '%s';",
      req.params.term
    );
    const course_sql = format(
      "SELECT * from courses WHERE courses.course_id = '%s';",
      req.params.term
    );

    const return_value = { course: {}, reviews: [] };

    const results = await Promise.all([
      client.query(reviews_sql),
      client.query(course_sql),
    ]);

    return_value.reviews = results[0].rows;
    return_value.course = results[1].rows;
    res.json({ results: return_value });
  })
);

module.exports = router;
