const config = require("../config.json");

const Pool = require("pg").Pool;
const pool = new Pool({
  user: config.pguser,
  host: config.pghost,
  database: config.pgdatabase,
  password: config.pgpassword,
  port: config.pgport,
});

const getTestcases = (request, response, next) => {
  const id = parseInt(request.params.id);

  // TODO: Add last status
  pool
    .query(
      `SELECT testcase.*, MAX(CASE WHEN status != 'tbd' THEN last_execution_date ELSE NULL END) AS last_execution_date
      FROM "testcase" 
        INNER JOIN (SELECT testcase_id, last_execution_date, status, run_id, last_executed_by FROM "testcase_run") AS t1 ON testcase.id = testcase_id
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
  // maybe use feature param here?
  const id = parseInt(request.params.id);
  const { scenario, description, created_by } = request.body;

  pool
    .query(
      `INSERT INTO "testcase" (feature, scenario, description, created_by) VALUES ($1, $2, $3, $4) RETURNING feature, id`,
      [id, scenario, description, created_by]
    )
    .then((results) => {
      response
        .status(201)
        .send(
          `Test case in feature ${results.rows[0].feature} added with ID: ${results.rows[0].id}`
        );
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
  const { scenario, description, last_modified_by } = request.body;

  pool
    .query(
      `UPDATE "testcase" SET scenario = $1, description = $2, last_modified_by = $3 WHERE feature = $4 AND id = $5`,
      [scenario, description, last_modified_by, feature, id]
    )
    .then((results) => {
      response
        .status(200)
        .send(`Test case ID ${id} of feature ID ${feature} modified`);
    })
    .catch((e) => {
      next(e);
    });
};

const deleteTestcase = (request, response, next) => {
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
  getTestcases,
  createTestcase,
  updateTestcase,
  deleteTestcase,
};
