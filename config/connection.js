const { Pool } = require("pg");

const db_info = {
  user: "postgres",
  host: "db",
  password: "password",
  port: 5432,
  database: "postgres",
};

const pool = new Pool(db_info);
// pool.connect();

console.log("new pg pool...");

module.exports = pool;
