const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const format = require("pg-format");
const client = require("../config/connection");

router.get(
  "/",
  asyncHandler(async (req, res, next) => {
    try {
      const sql = format(
        "SELECT professors.name, professors.prof_id, professors.nugget FROM professors;"
      );
      const result = await client.query(sql);
      console.log("res : ", result);
      res.json({ profs: result.rows });
    } catch (e) {
      res.json({ serverError: e });
    }
  })
);

router.get(
  "/name/:term",
  asyncHandler(async (req, res, next) => {
    try {
      const sql = format(
        "SELECT professors.name, professors.prof_id, professors.nugget FROM professors WHERE professors.name LIKE '%%%s%%%';",
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
    try {
      // return professor info, the reviews, and the names of the courses,
      const reviews_sql = format(
        "SELECT reviews.agree, reviews.disagree, reviews.content, reviews.workload, reviews.date, reviews.review_id, courses.name, courses.course_id from reviews INNER JOIN courses ON courses.course_id = reviews.course_id WHERE reviews.prof_id = '%s';",
        req.params.term
      );
      const prof_sql = format(
        "SELECT * from professors WHERE professors.prof_id = '%s';",
        req.params.term
      );

      const return_value = { professor: {}, reviews: [] };

      const results = await Promise.all([
        client.query(reviews_sql),
        client.query(prof_sql),
      ]);

      const valid_revs = results[0].rows.filter((rev) => rev.name !== "0");
      return_value.reviews = valid_revs;
      return_value.professor = results[1].rows;
      res.json({ results: return_value });
    } catch (e) {
      res.json({ serverError: e });
    }
  })
);

module.exports = router;
