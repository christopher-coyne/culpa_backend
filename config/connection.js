const { Client } = require("pg");

const client = new Client({
  user: "postgres",
  host: "culpa.cl1fcgklxgqn.us-west-2.rds.amazonaws.com",
  database: "postgres",
  password: "lemonpassword17",
  port: 5432,
});
client.connect();

console.log("new client...");

module.exports = client;
