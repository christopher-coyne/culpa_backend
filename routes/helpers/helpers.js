const format = require("pg-format");
const client = require("../../config/connection");

const checkExistence = async (prof, course, db_errors, ids) => {
  const sql_prof = format(
    "SELECT * FROM professors WHERE professors.name = '%s';",
    prof
  );
  const sql_course = format(
    "SELECT * FROM courses WHERE courses.name ='%s';",
    course
  );

  const existenceResults = await Promise.all([
    client.query(sql_prof),
    client.query(sql_course),
  ]);
  if (existenceResults[0].rows.length == 0) {
    db_errors.professor = true;
  } else {
    ids.professor = existenceResults[0].rows[0].prof_id;
  }
  if (existenceResults[1].rows.length == 0) {
    db_errors.course = true;
  } else {
    ids.course = existenceResults[1].rows[0].course_id;
  }
};

const getDate = () => {
  const numToMonth = {
    1: "January",
    2: "February",
    3: "March",
    4: "April",
    5: "May",
    6: "June",
    7: "July",
    8: "August",
    9: "September",
    10: "October",
    11: "November",
    12: "December",
  };
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, "0");
  var mm = String(today.getMonth() + 1);
  var yyyy = today.getFullYear();

  today = numToMonth[mm] + " " + dd + ", " + yyyy;
  return today;
};

const createPost = async (workload, content, errors, ids) => {
  try {
    // create a new random id for our new review. chances of collision are near zero
    const newReviewId = Math.random().toString(36).slice(2);
    const sql_teaches_course = format(
      "SELECT * FROM teaches_course WHERE teaches_course.course_id = '%s' AND teaches_course.prof_id ='%s';",
      ids.course,
      ids.professor
    );

    const sql_make_teaches_course = format(
      "INSERT INTO teaches_course(prof_id, course_id) VALUES ('%s', '%s');",
      ids.professor,
      ids.course
    );

    const sql_create_review = format(
      "INSERT INTO reviews(review_id, date, content, workload, agree, disagree, prof_id, course_id) VALUES ('%s', '%s', '%s', '%s', %L, %L, '%s', '%s');",
      newReviewId,
      getDate(),
      content,
      workload,
      0,
      0,
      ids.professor,
      ids.course
    );

    const teaches_course = await client.query(sql_teaches_course);
    console.log(teaches_course.rows);

    // doesn't already exist, have to make it
    if (!teaches_course) {
      await client.query(sql_make_teaches_course);
    }

    // now create the actual review
    await client.query(sql_create_review);
    errors.createdReview.review_id = newReviewId;
    errors.createdReview.prof_id = ids.professor;
    errors.createdReview.course_id = ids.course;
  } catch (e) {
    res.json({ serverError: e });
  }
};

exports.checkExistence = checkExistence;
exports.getDate = checkExistence;
exports.createPost = createPost;
