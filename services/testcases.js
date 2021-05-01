const config = require("../config.json");
const auth = require("../utils/authorizeRequest");

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

const getTestcases = (request, response, next) => {
  auth.authorizeRequest(request);
  const id = parseInt(request.params.id);

  // TODO: Add last status
  pool
    .query(
      `SELECT testcase.*, MAX(CASE WHEN status != 'tbd' THEN last_execution_date ELSE NULL END) AS last_execution_date
      FROM "testcase" 
        LEFT JOIN (SELECT testcase_id, last_execution_date, status, run_id, last_executed_by FROM "testcase_run") AS t1 ON testcase.id = testcase_id
      WHERE feature = $1
      GROUP BY id
      ORDER BY testcase.id ASC;`,
      [id]
    )
    .then((results) => {
      response.status(200).json(results.rows);
    })
    .catch((e) => {
      next(e);
    });
};

const createTestcase = (request, response, next) => {
  const featureID = parseInt(request.params.feature);
  const { scenario, description } = request.body;
  const user = auth.authorizeRequest(request);
  const created_date = unixTimeStamp();

  pool
    .query(
      `INSERT INTO "testcase" (feature, scenario, description, created_by, created_date) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [featureID, scenario, description, user.id, created_date]
    )
    .then((results) => {
      response.status(200).json(results.rows[0]);
    })
    .catch((e) => {
      if (e.code == "23505") {
        next(new Error("An error occured. Test case already exists."));
      } else {
        next(e);
      }
    });
};

const updateTestcase = (request, response, next) => {
  const feature = parseInt(request.params.feature);
  const id = parseInt(request.params.id);
  const { scenario, description } = request.body;
  const user = auth.authorizeRequest(request);
  const modified_date = unixTimeStamp();

  pool
    .query(
      `UPDATE "testcase" SET scenario = $1, description = $2, last_modified_by = $3, modified_date = $4 WHERE feature = $5 AND id = $6 RETURNING *`,
      [scenario, description, user.id, modified_date, feature, id]
    )
    .then((results) => {
      response.status(200).json(results.rows[0]);
    })
    .catch((e) => {
      next(e);
    });
};

const deleteTestcase = (request, response, next) => {
  const feature = parseInt(request.params.feature);
  const id = parseInt(request.params.id);
  auth.authorizeRequest(request);

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
  getTestcases,
  createTestcase,
  updateTestcase,
  deleteTestcase,
};
