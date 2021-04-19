const config = require("../config.json");

const Pool = require("pg").Pool;
const pool = new Pool({
  user: config.pguser,
  host: config.pghost,
  database: config.pgdatabase,
  password: config.pgpassword,
  port: config.pgport,
});

const getExecutions = (request, response, next) => {
  pool
    .query(
      `SELECT *, 
      (SELECT COUNT(*) FROM testcase_RUN WHERE run_id = id) AS testcase_count,
      (SELECT COUNT(status) FROM testcase_run WHERE status = 'passed' AND run_id = id) AS passed, 
      (SELECT COUNT(status) FROM testcase_run WHERE status = 'failed' AND run_id = id) AS failed,
      (SELECT COUNT(status) FROM testcase_run WHERE status = 'tbd' AND run_id = id) AS tbd
      FROM run
      ORDER BY id ASC`
    )
    .then((results) => {
      response.status(200).json(results.rows);
    })
    .catch((e) => {
      next(e);
    });
};

const getExecutionInfo = (request, response, next) => {
  const id = parseInt(request.params.id);

  pool
    .query(
      `SELECT run.*, created.username AS created_user, modified.username AS modified_user 
      FROM "run" 
      INNER JOIN "user" AS created ON created_by = created.id 
      INNER JOIN "user" AS modified ON last_modified_by = modified.id
      WHERE run.id = $1 
      ORDER BY run.id ASC`,
      [id]
    )
    .then((results) => {
      response.status(200).json(results.rows);
    })
    .catch((e) => {
      next(e);
    });
};

const createExecution = (request, response, next) => {
  const { name, slug, created_by } = request.body;

  pool
    .query(
      `INSERT INTO "run" (name, slug, created_by) VALUES ($1, $2, $3) RETURNING id`,
      [name, slug, created_by]
    )
    .then((results) => {
      response
        .status(201)
        .send(`Test execution added with ID: ${results.rows[0].id}`);
    })
    .catch((e) => {
      if (e.code == "23505") {
        next(new Error("An error occured. Test execution already exists."));
      } else {
        next(e);
      }
    });
};

const updateExecution = (request, response, next) => {
  const id = parseInt(request.params.id);
  const { name, slug, last_modified_by } = request.body;

  pool
    .query(
      `UPDATE "run" SET name = $1, slug = $2, last_modified_by = $3 WHERE id = $4`,
      [name, slug, last_modified_by, id]
    )
    .then((results) => {
      response.status(200).send(`Test execution modified with ID: ${id}`);
    })
    .catch((e) => {
      next(e);
    });
};

const deleteExecution = (request, response, next) => {
  const id = parseInt(request.params.id);

  pool
    .query(`DELETE FROM "run" WHERE id = $1`, [id])
    .then((results) => {
      response.status(200).send(`Test execution deleted with ID: ${id}`);
    })
    .catch((e) => {
      next(e);
    });
};

module.exports = {
  getExecutions,
  getExecutionInfo,
  createExecution,
  updateExecution,
  deleteExecution,
};
