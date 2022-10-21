/*eslint-env es6*/
const express = require("express");

/* pg-format to ensure no SQL injections */
var cors = require("cors");
const bodyParser = require("body-parser");

// routes
const testRoutes = require("./routes/testRoutes");
const postRoutes = require("./routes/postRoutes");
const profRoutes = require("./routes/profRoutes");
const courseRoutes = require("./routes/courseRoutes");
const reviewEntityRoutes = require("./routes/reviewEntityRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const chartRoutes = require("./routes/chartRoutes");

const app = express();

// middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// set up routes
app.use("/test", testRoutes);
app.use("/post", postRoutes);
app.use("/professor", profRoutes);
app.use("/course", courseRoutes);
app.use("/reviewentity", reviewEntityRoutes);
app.use("/review", reviewRoutes);
app.use("/chart", chartRoutes);

app.listen(10001, console.log("server running on port 10001"));
