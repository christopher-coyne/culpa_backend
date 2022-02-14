const express = require('express')
const format = require('pg-format');
const { Pool, Client } = require('pg')

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

app.get('/search/:term', (req, res) => {
  const sql = "SELECT * FROM professors"
    client.query(sql).then((result, err) => {
      res.json({'profs': result.rows})
    })
    // res.send(`you searched for : ${req.params.term}`)
})

app.get('/test/:term', (req, res) => {
  const sql = format("SELECT courses.name, courses.course_id FROM courses WHERE courses.name LIKE '%%%s%%' UNION SELECT pro;", req.params.term, req.params.term)
  console.log('sql format : ', sql)
  client.query(sql).then((result, err) => {
      console.log('res ', result)
      console.log('err ', err)
      res.json({'courses': result.rows})
      // console.log('erros ? ', x)
    }).catch((e) => {
      console.log('error', e)
    })
})

app.listen(5000, console.log('server running on port 5000'))
