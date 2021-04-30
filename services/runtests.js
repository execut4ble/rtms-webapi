const config = require("../config.json");
const jwt = require("jsonwebtoken");

const Pool = require("pg").Pool;
const pool = new Pool({
  user: config.pguser,
  host: config.pghost,
  database: config.pgdatabase,
  password: config.pgpassword,
  port: config.pgport,
});

function unixTimeStamp() {
  return Math.floor(+new Date() / 1000);
}

// TODO: Add authorization
const getRuntests = (request, response, next) => {
  const id = parseInt(request.params.id);

  pool
    .query(
      `SELECT testcase_id, feature.name AS feature_name, scenario, status, feature, last_execution_date
      FROM testcase
	  INNER JOIN "testcase_run" ON testcase_run.testcase_id = id
	  INNER JOIN "feature" ON feature.id = feature
	  WHERE run_id = $1
    ORDER BY feature ASC`,
      [id]
    )
    .then((results) => {
      response.status(200).json(results.rows);
    })
    .catch((e) => {
      next(e);
    });
};

// TODO: Add authorization
const createRuntest = (request, response, next) => {
  // maybe use feature param here?
  const run_id = parseInt(request.params.id);
  const { feature } = request.body;

  pool
    .query(
      `
      INSERT INTO testcase_run (testcase_id, run_id, status) SELECT id, '$1', 'tbd' FROM "testcase" WHERE feature = ANY ($2);
      `,
      [run_id, feature]
    )
    .then((results) => {
      response.status(201).json(results);
    })
    .catch((e) => {
      if (e.code == "23505") {
        next(new Error("An error occured. Test execution already exists."));
      } else {
        next(e);
      }
    });
};

const updateRuntest = (request, response, next) => {
  const run_id = parseInt(request.params.run);
  const testcase_id = parseInt(request.params.testcase);
  const { status } = request.body;

  if (
    !request.headers.authorization ||
    !request.headers.authorization.startsWith("Bearer") ||
    !request.headers.authorization.split(" ")[1]
  ) {
    return response.status(422).json({
      message: "Please provide the token",
    });
  }

  const token = request.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, config.jwtsecret);

  const last_execution_date = unixTimeStamp();

  pool
    .query(
      `UPDATE "testcase_run" SET status = $1, last_executed_by = $2, last_execution_date = $3 WHERE testcase_id = $4 AND run_id = $5 RETURNING *`,
      [status, decoded.id, last_execution_date, testcase_id, run_id]
    )
    .then((results) => {
      response.status(200).json(results.rows[0]);
    })
    .catch((e) => {
      next(e);
    });
};

// TODO: Add authorization
const deleteRuntest = (request, response, next) => {
  const feature = parseInt(request.params.feature);
  const id = parseInt(request.params.id);

  pool
    .query(`DELETE FROM "testcase" WHERE feature = $1 AND id = $2`, [
      feature,
      id,
    ])
    .then((results) => {
      response
        .status(200)
        .send(`Test case ID ${id} of feature ID ${feature} modified`);
    })
    .catch((e) => {
      next(e);
    });
};

module.exports = {
  getRuntests,
  createRuntest,
  updateRuntest,
  deleteRuntest,
};
