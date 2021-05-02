const express = require("express");
const config = require("./config.json");
const cors = require("cors");
const logger = require("morgan");

const app = express();

const isProduction = process.env.NODE_ENV === "production";

var usersRouter = require("./routes/users");
var featuresRouter = require("./routes/features");
var testcasesRouter = require("./routes/testcases");
var executionsRouter = require("./routes/executions");
var executionTestsRouter = require("./routes/runtests");
var defectsRouter = require("./routes/defects");
var watchedRouter = require("./routes/watchedRuns");

app.use(logger("dev"));
app.use(cors());
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.get("/", (request, response) => {
  response.json({ info: "Node.js, Express, and Postgres API" });
});

app.use("/users", usersRouter);
app.use("/features", featuresRouter);
app.use("/testcases", testcasesRouter);
app.use("/runs", executionsRouter);
app.use("/runtests", executionTestsRouter);
app.use("/defects", defectsRouter);
app.use("/watched", watchedRouter);
app.use((error, request, response, next) => {
  console.log(error.stack);
  if (isProduction) {
    response.status(500).json({ status: 500, error: error.message });
  } else {
    response.status(500).json({ status: 500, error: error.stack });
  }
});

app.listen(config.port, () => {
  console.log("Listening on port " + config.port);
});
