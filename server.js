const express = require('express')
const format = require('pg-format');
const bodyParser = require('body-parser')
const { Pool, Client } = require('pg')
const fs = require('fs')

const app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

/* postgresql stuff */
const client = new Client({
    user: 'postgres',
    host: 'culpa.cl1fcgklxgqn.us-west-2.rds.amazonaws.com',
    database: 'postgres',
    password: 'Ammon913',
    port: 5432,
  })
  client.connect();

app.get('/search-prof-name/:term', (req, res) => {
  const sql = format("SELECT professors.name, professors.prof_id, professors.nugget FROM professors WHERE professors.name LIKE '%%%s%%%';", req.params.term)
  console.log('sql : ', sql)
    client.query(sql).then((result, err) => {
      console.log("results : ", result)
      res.json({'profs': result.rows})
  })
})

app.get('/search-course-name/:term', (req, res) => {
  const sql = format("SELECT courses.name, courses.course_id FROM courses WHERE courses.name LIKE '%%%s%%%';", req.params.term)
  console.log('sql : ', sql)
    client.query(sql).then((result, err) => {
      console.log("results : ", result)
      res.json({'courses': result.rows})
  })
})


app.get('/get-all-profs', (req, res) => {
  const sql = format("SELECT professors.name, professors.prof_id, professors.nugget FROM professors;")
    client.query(sql).then((result, err) => {
      console.log("results : ", result)
      res.json({'profs': result.rows})
    })
})

app.get('/get-professor-reviews/:term', (req, res) => {
  // const sql_reviews = format("SELECT professors.name, professors.prof_id, professors.nugget FROM professors WHERE professors.name LIKE '%%%s%%';", req.params.term)
  // const prof_data = format("SELECT professors.name, professors.prof_id, professors.nugget FROM professors WHERE professors.name LIKE '%%%s%%';", req.params.term)

  // want to return professor info, the reviews, and the names of the courses

  // for now, try to find all data on all tables
  // const sql = format("SELECT * from reviews WHERE reviews.prof_id = '%s';", req.params.term)
  const sql = format("SELECT reviews.agree, reviews.disagree, reviews.content, reviews.workload, reviews.date, courses.name, courses.course_id from reviews INNER JOIN courses ON courses.course_id = reviews.course_id WHERE reviews.prof_id = '%s';", req.params.term)
  const sql2 = format("SELECT * from professors WHERE professors.prof_id = '%s';", req.params.term)

  const return_value = {"professor": {}, "reviews": []}

    client.query(sql).then((result, err) => {
      return_value.reviews = result.rows
      client.query(sql2).then((result, err) => {
        return_value.professor = result.rows
        res.json({'results': return_value})
      })
    })

})

app.get('/match-term-all/:term', (req, res) => {
  const sql = format("SELECT courses.name AS name, courses.course_id AS id, 'course' as type FROM courses WHERE courses.name LIKE '%%%s%%' UNION ALL SELECT professors.name, professors.prof_id, professors.nugget FROM professors WHERE professors.name LIKE '%%%s%%';", req.params.term, req.params.term)
  console.log('sql format : ', sql)
  client.query(sql).then((result, err) => {
      console.log('res ', result)
      console.log('err ', err)
      res.json({'results': result.rows})
      // console.log('erros ? ', x)
    }).catch((e) => {
      console.log('error', e)
    })
})

app.post('/submit', (req, res) => {
  console.log('body of post : ', req.body)

  res.json({'professor': false, 'course': false, 'workload': false, 'content': false})
})

app.listen(5000, console.log('server running on port 5000'))
