const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const helpers = require("./helpers/helpers");

router.post(
  "/",
  asyncHandler(async (req, res, next) => {
    try {
      console.log("body of post : ", req.body);
      const ids = {};
      let prof_results;
      let prof_already_teaches = false;
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

      console.log("ids after check existence : ", ids);

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

module.exports = router;
