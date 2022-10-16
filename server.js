/*eslint-env es6*/
const express = require("express");

/* pg-format to ensure no SQL injections */
const format = require("pg-format");
var cors = require("cors");
const bodyParser = require("body-parser");
const { Pool, Client } = require("pg");
const fs = require("fs");
const asyncHandler = require("express-async-handler");

// routes
const testRoutes = require("./routes/testRoutes");
const postRoutes = require("./routes/postRoutes");
const profRoutes = require("./routes/profRoutes");
const courseRoutes = require("./routes/courseRoutes");
const reviewEntityRoutes = require("./routes/reviewEntityRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const chartRoutes = require("./routes/chartRoutes");

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

/* postgresql stuff */

/*
const client = new Client({
  user: "postgres",
  host: "culpa.cl1fcgklxgqn.us-west-2.rds.amazonaws.com",
  database: "postgres",
  password: "lemonpassword17",
  port: 5432,
});
client.connect();
*/
/* process.env.DB_HOST */
const db_info = {
  user: "postgres",
  host: "db",
  password: "password",
  port: 5432,
  database: "postgres",
};

console.log("db info : ", db_info);
const client = new Client(db_info);

const connections = async () => {
  setTimeout(() => {
    console.log("connecting...");
    client.connect();
  }, 3000);
};
connections();

app.use("/test", testRoutes);
app.use("/post", postRoutes);
app.use("/professor", profRoutes);
app.use("/course", courseRoutes);
app.use("/reviewentity", reviewEntityRoutes);
app.use("/review", reviewRoutes);
app.use("/chart", chartRoutes);

app.get(
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

      /*
       * For each deleted review, check to see if there are other reviews with the same
       * course_id and professor_id. If so, then continue. Otherwise, there is now an empty
       * page associated with the teaches_course table, which we can safely delete.
       */
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

app.listen(10001, console.log("server running on port 10001"));
