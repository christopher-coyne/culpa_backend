const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const helpers = require("./helpers/helpers");

router.post(
  "/",
  asyncHandler(async (req, res, next) => {
    try {
      const ids = {};
      let errors = {
        professor: false,
        course: false,
        workload: false,
        content: false,
        other: false,
        createdReview: {},
      };

      // make sure workload and content exist
      if (!req.body.workload) {
        console.log("errors in workload ! ");
        errors.workload = true;
      }
      if (!req.body.content) {
        console.log("errors in content ! ");
        errors.content = true;
      }

      // makes sure that the professor and course provided exist in the db
      await helpers.checkExistence(
        req.body.professor,
        req.body.course,
        errors,
        ids
      );

      if (
        errors.workload ||
        errors.professor ||
        errors.course ||
        errors.content
      ) {
        res.json({ ...errors });
      }

      // otherwise - we are good to add it.
      else {
        await helpers.createPost(
          req.body.workload,
          req.body.content,
          errors,
          ids
        );
        res.json({ ...errors });
      }
    } catch (e) {
      res.json({ serverError: e });
    }
  })
);

// cleanup route - delete all reviews not part of the original
router.get(
  "/cleanup",
  asyncHandler(async (req, res, next) => {
    try {
      const sql = format(
        "SELECT * FROM reviews WHERE reviews.date LIKE '%2022%';",
        req.params.term
      );

      const results = await client.query(sql);

      const deleted = [];
      for (const result of results.rows) {
        const removeSql = format(
          "DELETE FROM reviews WHERE reviews.review_id = '%s';",
          result.review_id
        );
        deleted.push({
          review_id: result.review_id,
          prof_id: result.prof_id,
          course_id: result.course_id,
        });
        await client.query(removeSql);
      }

      // For each deleted review, check to see if there are other reviews with the same
      // course_id and professor_id. If so, then continue. Otherwise, there is now an empty
      // page associated with the teaches_course table, which we can safely delete.
      //
      for (const review of deleted) {
        const checkReviewsSql = format(
          "SELECT reviews.review_id FROM reviews WHERE reviews.prof_id = '%s' AND reviews.course_id = '%s';",
          review.prof_id,
          review.course_id
        );
        const removeTeachesCourseSql = format(
          "DELETE FROM teaches_course WHERE teaches_course.prof_id = '%s' AND teaches_course.course_id = '%s';",
          review.prof_id,
          review.course_id
        );

        let res = await client.query(checkReviewsSql);

        if (res.rows.length === 0) {
          await client.query(removeTeachesCourseSql);
        }
      }

      res.json({ res: deleted });
    } catch (e) {
      res.json({ serverError: e });
    }
  })
);

module.exports = router;
