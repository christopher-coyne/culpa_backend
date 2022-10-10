const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const format = require("pg-format");
const client = require("../config/connection");

router.delete(
  "/:term",
  asyncHandler(async (req, res, next) => {
    try {
      console.log("deleting post...");
      const sql = format(
        "SELECT * FROM reviews WHERE reviews.review_id = '%s' AND reviews.date LIKE '%2022%';",
        req.params.term
      );

      let results = (await client.query(sql)).rows[0];

      const removeSql = format(
        "DELETE FROM reviews WHERE reviews.review_id = '%s';",
        results.review_id
      );
      const { data } = await client.query(removeSql);
      console.log("data ", data);

      // For each deleted review, check to see if there are other reviews with the same
      // course_id and professor_id. If so, then continue. Otherwise, there is now an empty
      // page associated with the teaches_course table, which we can safely delete.
      const checkReviewsSql = format(
        "SELECT reviews.review_id FROM reviews WHERE reviews.prof_id = '%s' AND reviews.course_id = '%s';",
        results.prof_id,
        results.course_id
      );
      const removeTeachesCourseSql = format(
        "DELETE FROM teaches_course WHERE teaches_course.prof_id = '%s' AND teaches_course.course_id = '%s';",
        results.prof_id,
        results.course_id
      );

      results = await client.query(checkReviewsSql);

      if (results.rows.length === 0) {
        await client.query(removeTeachesCourseSql);
      }

      res.json({ res: "deleted" });
    } catch (e) {
      console.log("error : ", e);
      res.json({ serverError: e });
    }
  })
);

module.exports = router;
