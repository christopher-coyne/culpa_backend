const express = require('express')
const format = require('pg-format');
const { Pool, Client } = require('pg')
const fs = require('fs')

const app = express()

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
  const sql = format("SELECT professors.name, professors.prof_id, professors.nugget FROM professors WHERE professors.name LIKE '%%%s%%';", req.params.term)
    client.query(sql).then((result, err) => {
      res.json({'profs': result.rows})
    })
})

app.get('/get-prof-reviews/:term', (req, res) => {
  // const sql_reviews = format("SELECT professors.name, professors.prof_id, professors.nugget FROM professors WHERE professors.name LIKE '%%%s%%';", req.params.term)
  // const prof_data = format("SELECT professors.name, professors.prof_id, professors.nugget FROM professors WHERE professors.name LIKE '%%%s%%';", req.params.term)

  // for now, try to find all data on all tables
  const sql = format("SELECT * from reviews WHERE reviews.prof_id = '%s';", req.params.term)
  const sql2 = format("SELECT * from professors WHERE professors.prof_id = '%s';", req.params.term)

  const return_value = {"professor": null, "reviews": []}

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

app.listen(5000, console.log('server running on port 5000'))
