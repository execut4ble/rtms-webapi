const config = require("../config.json");

const Pool = require("pg").Pool;
const pool = new Pool({
  user: config.pguser,
  host: config.pghost,
  database: config.pgdatabase,
  password: config.pgpassword,
  port: config.pgport,
});

const getRuntests = (request, response, next) => {
  const id = parseInt(request.params.id);

  pool
    .query(
      `SELECT testcase_id, feature.name AS feature_name, scenario, status, feature
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

const createRuntest = (request, response, next) => {
  // maybe use feature param here?
  const run_id = parseInt(request.params.id);
  const { features } = request.body;
  console.log(features[0]);
  console.log(features[1]);
  const inserts = `INSERT INTO testcase_run (testcase_id, run_id, status) SELECT id, ${run_id}, 'tbd' FROM "testcase" WHERE feature IN (${features[0]}, ${features[1]});`;

  pool
    .query(
      `
      BEGIN;
      ${inserts}
      COMMIT;
      `,
      []
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
