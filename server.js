/*eslint-env es6*/
const express = require("express");
const format = require("pg-format");
const bodyParser = require("body-parser");
const { Pool, Client } = require("pg");
const fs = require("fs");
const asyncHandler = require("express-async-handler");

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

/* postgresql stuff */
/*
const client = new Client({
  user: "postgres",
  host: "culpa.cl1fcgklxgqn.us-west-2.rds.amazonaws.com",
  database: "postgres",
  password: "Ammon913",
  port: 5432,
});
client.connect();
*/
const client = new Client({
  user: "postgres",
  host: "culpa.cl1fcgklxgqn.us-west-2.rds.amazonaws.com",
  database: "postgres",
  password: "lemonpassword17",
  port: 5432,
});
client.connect();
/* process.env.DB_HOST */
/*
const db_info = {
  user: "postgres",
  host: "db",
  password: "password",
  port: 5432,
  database: "postgres",
};
*/

/*
console.log("db info : ", db_info);
const client = new Client(db_info);

const connections = async () => {
  setTimeout(() => {
    console.log("connecting...");
    client.connect();
  }, 30000);
};
connections();
*/

app.get(
  "/hello-world",
  asyncHandler(async (req, res, next) => {
    res.json({ courses: "hello world" });
  })
);

const months = {
  January: 1,
  February: 2,
  March: 3,
  April: 4,
  May: 5,
  June: 6,
  July: 7,
  August: 8,
  September: 9,
  October: 10,
  November: 11,
  December: 12,
};

/* get rid of any recent reviews to prevent clogging. eliminate everything with 2022 in date */
app.get(
  "/cleanup",
  asyncHandler(async (req, res, next) => {
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
  })
);

app.post(
  "/remove-post/:term",
  asyncHandler(async (req, res, next) => {
    console.log("term : ", req.params.term);
    req.params.term;
    const sql = format(
      "SELECT * FROM reviews WHERE reviews.review_id = '%s' AND reviews.date LIKE '%2022%';",
      req.params.term
    );

    console.log("sql : ", sql);

    let results = (await client.query(sql)).rows[0];
    console.log("results : ", results);

    const removeSql = format(
      "DELETE FROM reviews WHERE reviews.review_id = '%s';",
      results.review_id
    );
    const { data } = await client.query(removeSql);
    console.log("data ", data);

    /*
     * For each deleted review, check to see if there are other reviews with the same
     * course_id and professor_id. If so, then continue. Otherwise, there is now an empty
     * page associated with the teaches_course table, which we can safely delete.
     */
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
  })
);

app.get(
  "/search-prof-name/:term",
  asyncHandler(async (req, res, next) => {
    const sql = format(
      "SELECT professors.name, professors.prof_id, professors.nugget FROM professors WHERE professors.name LIKE '%%%s%%%';",
      req.params.term
    );
    const result = await client.query(sql);
    console.log("res : ", result);
    res.json({ profs: result.rows });
  })
);

app.get(
  "/search-course-name/:term",
  asyncHandler(async (req, res, next) => {
    const sql = format(
      "SELECT courses.name, courses.course_id FROM courses WHERE courses.name LIKE '%%%s%%%';",
      req.params.term
    );
    const result = await client.query(sql);
    console.log("res : ", result);
    res.json({ courses: result.rows });
  })
);

app.get(
  "/get-all-profs",
  asyncHandler(async (req, res, next) => {
    const sql = format(
      "SELECT professors.name, professors.prof_id, professors.nugget FROM professors;"
    );
    const result = await client.query(sql);
    console.log("res : ", result);
    res.json({ profs: result.rows });
  })
);

app.get(
  "/get-professor-reviews/:term",
  asyncHandler(async (req, res, next) => {
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
  })
);

app.get(
  "/get-course-reviews/:term",
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

/*
app.get("/get-course-reviews/:term", (req, res) => {
  // const sql_reviews = format("SELECT professors.name, professors.prof_id, professors.nugget FROM professors WHERE professors.name LIKE '%%%s%%';", req.params.term)
  // const prof_data = format("SELECT professors.name, professors.prof_id, professors.nugget FROM professors WHERE professors.name LIKE '%%%s%%';", req.params.term)

  // want to return professor info, the reviews, and the names of the courses

  // for now, try to find all data on all tables
  // const sql = format("SELECT * from reviews WHERE reviews.prof_id = '%s';", req.params.term)
  const sql = format(
    "SELECT reviews.agree, reviews.disagree, reviews.content, reviews.workload, reviews.date, professors.name, professors.prof_id from reviews INNER JOIN professors ON professors.prof_id = reviews.prof_id WHERE reviews.course_id = '%s';",
    req.params.term
  );
  const sql2 = format(
    "SELECT * from courses WHERE courses.course_id = '%s';",
    req.params.term
  );

  const return_value = { course: {}, reviews: [] };

  client.query(sql).then((result, err) => {
    const valid_revs = result.rows.filter((rev) => rev.name !== "0");
    return_value.reviews = valid_revs;
    client.query(sql2).then((result, err) => {
      return_value.course = result.rows;
      res.json({ results: return_value });
    });
  });
});
*/

app.get(
  "/match-term-all/:term",
  asyncHandler(async (req, res, next) => {
    const sql = format(
      "SELECT courses.name AS name, courses.course_id AS id, 'course' as type FROM courses WHERE courses.name LIKE '%%%s%%' UNION ALL SELECT professors.name, professors.prof_id, professors.nugget FROM professors WHERE professors.name LIKE '%%%s%%';",
      req.params.term,
      req.params.term
    );

    const result = await client.query(sql);
    res.json({ results: result.rows });
  })
);

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
  console.log("existence results : ", existenceResults[1].rows);
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

// req.body.workload, req.body.content, req.body.professor, req.body.course
const createPost = async (workload, content, errors, ids) => {
  console.log("professor : ", ids.professor);
  console.log("course : ", ids.course);
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
  const results = await client.query(sql_create_review);
  errors.createdReview.review_id = newReviewId;
  errors.createdReview.prof_id = ids.professor;
  errors.createdReview.course_id = ids.course;
  console.log("results from creation : ", results);
};

app.post(
  "/submit",
  asyncHandler(async (req, res, next) => {
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
    await checkExistence(req.body.professor, req.body.course, errors, ids);

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
      await createPost(req.body.workload, req.body.content, errors, ids);
      res.json({ ...errors });
    }
  })
);

app.get("/get-popular-courses-full", (req, res) => {
  // const sql = format("SELECT courses.name, reviews.date from courses INNER JOIN reviews ON reviews.course_id = courses.course_id WHERE courses.name IN ('operating systems i', 'introduction to databases', 'programming languages and translators', 'artificial intelligence', 'analysis of algorithms i', 'user interface design')")
  fs.readFile("./fileTest.json", "utf8", function (err, data) {
    const data_json = JSON.parse(data);
    console.log("returning data json : ", data_json);
    res.json({ results: data_json });
  });
});

app.get("/get-chart-data", (req, res) => {
  fs.readFile("./cleanedrevs4.json", "utf8", function (err, data) {
    const data_json_scatter = JSON.parse(data);
    fs.readFile("./bardatatotal.json", "utf8", function (err, data2) {
      const data_json_bar = JSON.parse(data2);
      fs.readFile("./linedatatotal.json", "utf8", function (err, data3) {
        const data_json_line = JSON.parse(data3);
        res.json({
          scatter: data_json_scatter,
          bar: data_json_bar,
          line: data_json_line,
        });
      });
    });
  });
});

app.get("/fill-line", (req, res) => {
  return;

  fs.readFile("./linejsontotal.json", "utf8", function (err, data3) {
    const data_json_line = JSON.parse(data3);
    const name_count = {
      "adam cannon": {},
      "paul blaer": {},
      "jae lee": {},
      "martha kim": {},
      "ansaf salleb-aouissi": {},
    };

    for (const rev of data_json_line) {
      const year = rev.date.split("-")[0];
      if (name_count[rev.prof_name][year]) {
        name_count[rev.prof_name][year] += 1;
      } else {
        name_count[rev.prof_name][year] = 1;
      }
    }

    fs.writeFile(
      "./linedatatotal.json",
      JSON.stringify(name_count),
      function (err, lineJson) {
        return;
      }
    );
  });

  /*
  const prof_ids_to_names = {
    '515': 'adam cannon',
    '3409': 'paul blaer',
    '3509': 'jae lee',
    '4221': 'martha kim',
    '13076': 'ansaf salleb-aouissi'
  }
  const date_cleaner = str_date => {
    const date_to_num = {
      'January': '01',
      'February': '02',
      'March': '03',
      'April': '04',
      'May': '05',
      'June': '06',
      'July': '07',
      'August': '08',
      'September': '09',
      'October': '10',
      'November': '11',
      'December': '12'
    }
    const split_date = str_date.split(' ')
    // return in format year-month-date
    // May 10, 2001
    return `${split_date[2]}-${date_to_num[split_date[0]]}-${split_date[1].replace(',', '')}`
  }
  // get professor IDS and names of profs we want to measure
  // const sql = format("SELECT professors.name, professors.prof_id from professors WHERE professors.id IN ('525', '3409', '3509', '4221', '13076')")
  const sql = format("SELECT reviews.date, reviews.prof_id from reviews WHERE reviews.prof_id IN ('515', '3409', '3509', '4221', '13076')")
  client.query(sql).then((result, err) => {
    console.log('err ', err)
    console.log('res : ', result.rows)
    const lineJson = result.rows.map(rev => {
      return {'date':date_cleaner(rev.date), 'prof_name':prof_ids_to_names[rev.prof_id]}
    })

    fs.writeFile('./linejsontotal.json', JSON.stringify(lineJson), function(err, lineJson) {
      return
    })
  })
  */

  // const sql = format("SELECT courses.name, reviews.content from courses INNER JOIN reviews ON reviews.course_id = courses.course_id WHERE courses.name IN ('operating systems i', 'introduction to databases', 'programming languages and translators', 'artificial intelligence', 'analysis of algorithms i', 'user interface design')")

  // const sql = format("SELECT reviews.date, courses.name, courses.course_id from reviews INNER JOIN courses ON courses.course_id = reviews.course_id WHERE reviews.prof_id = IN()", req.params.term)
});

app.get("/fill-bar", (req, res) => {
  // const sql = format("SELECT courses.name, reviews.content from courses INNER JOIN reviews ON reviews.course_id = courses.course_id WHERE courses.name IN ('operating systems i', 'introduction to databases', 'programming languages and translators', 'artificial intelligence', 'analysis of algorithms i', 'user interface design')")

  /*
  client.query(sql).then((result, err) => {
    console.log('row ', result.rows)
    console.log('err ', err)
    fs.writeFile('./bardata.json', JSON.stringify(result.rows), function(err, data) {
      return
      
    })
  })
  */
  return;
  fs.readFile("./bardata.json", "utf8", function (err, json_revs) {
    const counts = {
      "operating systems i": {
        easy: 0,
        hard: 0,
        total: 0,
        boring: 0,
        interesting: 0,
        fair: 0,
      },
      "introduction to databases": {
        easy: 0,
        hard: 0,
        total: 0,
        boring: 0,
        interesting: 0,
        fair: 0,
      },
      "programming languages and translators": {
        easy: 0,
        hard: 0,
        total: 0,
        boring: 0,
        interesting: 0,
        fair: 0,
      },
      "analysis of algorithms i": {
        easy: 0,
        hard: 0,
        total: 0,
        boring: 0,
        interesting: 0,
        fair: 0,
      },
      "artificial intelligence": {
        easy: 0,
        hard: 0,
        total: 0,
        boring: 0,
        interesting: 0,
        fair: 0,
      },
      "user interface design": {
        easy: 0,
        hard: 0,
        total: 0,
        boring: 0,
        interesting: 0,
        fair: 0,
      },
    };

    const data_json = JSON.parse(json_revs);
    for (const rev of data_json) {
      occs = (rev.content.match(/easy/g) || []).length;
      counts[rev.name].easy += occs;
      occs = (rev.content.match(/hard/g) || []).length;
      counts[rev.name].hard += occs;
      occs = (rev.content.match(/boring/g) || []).length;
      counts[rev.name].boring += occs;
      occs = (rev.content.match(/interesting/g) || []).length;
      counts[rev.name].interesting += occs;
      occs = (rev.content.match(/fair/g) || []).length;
      counts[rev.name].fair += occs;

      counts[rev.name].total += 1;
    }
    fs.writeFile(
      "./bardatatotal.json",
      JSON.stringify(counts),
      function (err, data2) {
        return;
      }
    );

    // words to use...
    // easy, hard, boring, interesting, fair
  });
});

app.get("/get-scatter", (req, res) => {
  return;
  fs.readFile("./cleanedrevs2.json", "utf8", function (err, data) {
    let data_json = JSON.parse(data);

    const type_to_color = {
      systems: "blue",
      "intelligent systems": "red",
      vgr: "yellow",
      applications: "purple",
      theory: "green",
      intro: "orange",
      NA: "gray",
    };

    const total_dates = [];
    const na = { dates: [], names: [], vals: [], color: "red" };
    const systems = { dates: [], names: [], vals: [], color: "red" };
    const vgr = { dates: [], names: [], vals: [], color: "red" };
    const intelligent_systems = {
      dates: [],
      names: [],
      vals: [],
      color: "red",
    };
    const theory = { dates: [], names: [], vals: [], color: "red" };
    const intro = { dates: [], names: [], vals: [], color: "red" };
    const applications = { dates: [], names: [], vals: [], color: "red" };

    let na_count = 0;

    for (const rev of data_json) {
      total_dates.push(rev.date);
      const type = rev.type;
      if (type == "NA") {
        na.dates.push(rev.date);
        na.names.push(rev.name);
        na.vals.push(rev.reactions);
        na_count += 1;
      } else if (type == "systems") {
        systems.dates.push(rev.date);
        systems.names.push(rev.name);
        systems.vals.push(rev.reactions);
      } else if (type == "intelligent systems") {
        intelligent_systems.dates.push(rev.date);
        intelligent_systems.names.push(rev.name);
        intelligent_systems.vals.push(rev.reactions);
      } else if (type == "vgr") {
        vgr.dates.push(rev.date);
        vgr.names.push(rev.name);
        vgr.vals.push(rev.reactions);
      } else if (type == "theory") {
        theory.dates.push(rev.date);
        theory.names.push(rev.name);
        theory.vals.push(rev.reactions);
      } else if (type == "intro") {
        intro.dates.push(rev.date);
        intro.names.push(rev.name);
        intro.vals.push(rev.reactions);
      } else if (type == "applications") {
        applications.dates.push(rev.date);
        applications.names.push(rev.name);
        applications.vals.push(rev.reactions);
      }
    }

    data_json = {
      total_dates,
      na,
      systems,
      intelligent_systems,
      intro,
      theory,
      applications,
      vgr,
    };

    console.log("data json : ", data_json);

    fs.writeFile(
      "./cleanedrevs4.json",
      JSON.stringify(data_json),
      function (err, data2) {
        return;
      }
    );
  });
  /*
  const sql = format("SELECT courses.name, reviews.date, reviews.agree, reviews.disagree from courses INNER JOIN reviews ON reviews.course_id = courses.course_id")

  client.query(sql).then((result, err) => {
    console.log('res ', result)
    console.log('err ', err)
    fs.writeFile('./fullrevs.txt', JSON.stringify(result), err => {
      if (err) {
        console.error(err)
        return
      }
      //file written successfully
    })
    */

  /*
    fs.readFile('./allnames.json', 'utf8', function(err, data) {
      const data_json = JSON.parse(data)

      fs.readFile('./fullrevs.json', 'utf8', function(err, json_revs) {
        const allrevs = JSON.parse(json_revs)
        const cleaned_revs = allrevs.map(course => {
          return {...course, 'type':data_json[course.name]}
        })
    
        fs.writeFile('./cleanedrevs.json', JSON.stringify(cleaned_revs), err => {
          if (err) {
            console.error(err)
            return
          }
          //file written successfully
        })
      })
  
    })
    */

  /*
    const date_cleaner = str_date => {
      const date_to_num = {
        'January': '01',
        'February': '02',
        'March': '03',
        'April': '04',
        'May': '05',
        'June': '06',
        'July': '07',
        'August': '08',
        'September': '09',
        'October': '10',
        'November': '11',
        'December': '12'
      }
      const split_date = str_date.split(' ')
      // return in format year-month-date
      // May 10, 2001
      return `${split_date[2]}-${date_to_num[split_date[0]]}-${split_date[1].replace(',', '')}`
    }
    */

  /* return cleanedrevs.json */
  /*
    fs.readFile('./cleanedrevs.json', 'utf8', function(err, data) {
      let data_json = JSON.parse(data)
      console.log('data json : ', data_json)
      data_json = data_json.map(rev => {
        return {name:rev.name, date:date_cleaner(rev.date), reactions:(rev.agree + rev.disagree), type:rev.type}
      })

      fs.writeFile('./cleanedrevs2.json', JSON.stringify(data_json), function(err, data2) {
        return
      })
  
    })
    */

  /*
  fs.writeFile('./allreviews.json', 'utf8', function(err, data) {
    const data_json = JSON.parse(data)
    console.log('returning data json : ', data_json)
    res.json({'results': data_json})
  })
  */
});

app.listen(10001, console.log("server running on port 10001"));
