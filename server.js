const express = require('express')
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
    client.query('SELECT * FROM courses', (err, res) => {
        console.log(err, res)
        client.end()
      })
    res.send(`you searched for : ${req.params.term}`)
})

app.listen(5000, console.log('server running on port 5000'))
