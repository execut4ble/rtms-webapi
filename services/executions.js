const config = require("../config.json");
const auth = require("../utils/authorizeRequest");
const timestamp = require("../utils/unixTimeStamp");

const Pool = require("pg").Pool;
const pool = new Pool({
  user: config.pguser,
  host: config.pghost,
  database: config.pgdatabase,
  password: config.pgpassword,
  port: config.pgport,
});

const getExecutions = (request, response, next) => {
  auth.authorizeRequest(request, response, next);
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

const getActiveExecutions = (request, response, next) => {
  auth.authorizeRequest(request, response, next);
  pool
    .query(
      `SELECT *, 
      (SELECT COUNT(*) FROM testcase_RUN WHERE run_id = id) AS testcase_count,
      (SELECT COUNT(status) FROM testcase_run WHERE status = 'passed' AND run_id = id) AS passed, 
      (SELECT COUNT(status) FROM testcase_run WHERE status = 'failed' AND run_id = id) AS failed,
      (SELECT COUNT(status) FROM testcase_run WHERE status = 'tbd' AND run_id = id) AS tbd
      FROM run
      WHERE is_active = true
      ORDER BY id ASC`
    )
    .then((results) => {
      response.status(200).json(results.rows);
    })
    .catch((e) => {
      next(e);
    });
};

const getInactiveExecutions = (request, response, next) => {
  auth.authorizeRequest(request, response, next);
  pool
    .query(
      `SELECT *, 
      (SELECT COUNT(*) FROM testcase_RUN WHERE run_id = id) AS testcase_count,
      (SELECT COUNT(status) FROM testcase_run WHERE status = 'passed' AND run_id = id) AS passed, 
      (SELECT COUNT(status) FROM testcase_run WHERE status = 'failed' AND run_id = id) AS failed,
      (SELECT COUNT(status) FROM testcase_run WHERE status = 'tbd' AND run_id = id) AS tbd
      FROM run
      WHERE is_active = false
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
  auth.authorizeRequest(request, response, next);
  const id = parseInt(request.params.id);

  pool
    .query(
      `SELECT run.*, created.username AS created_user, modified.username AS modified_user
      FROM "run" 
      INNER JOIN "user" AS created ON created_by = created.id 
      LEFT JOIN "user" AS modified ON last_modified_by = modified.id
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
  const { name, slug, is_active, feature } = request.body;
  const user = auth.authorizeRequest(request, response, next);
  const created_date = timestamp.unixTimeStamp();

  pool
    .query(
      `
      WITH ins1 AS (
        INSERT INTO "run" (name, slug, is_active, created_by, created_date) 
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id AS run_id
        ), testcases AS (
          INSERT INTO testcase_run (testcase_id, run_id, status)
          SELECT id, (SELECT run_id FROM ins1), 'tbd' FROM "testcase" WHERE feature = ANY ($6) RETURNING *
          )
		    SELECT (SELECT run_id FROM ins1) AS id, count(*) AS testcase_count FROM testcases;
      `,
      [name, slug, is_active, user.id, created_date, feature]
    )
    .then((results) => {
      response.status(201).json(results.rows[0]);
    })
    .catch((e) => {
      if (e.code == "23505") {
        return response.status(409).json({
          message: "An error occured. Test execution already exists.",
        });
      } else {
        next(e);
      }
    });
};

const updateExecution = (request, response, next) => {
  const id = parseInt(request.params.id);
  const { name, slug, is_active } = request.body;
  const user = auth.authorizeRequest(request, response, next);
  const modified_date = timestamp.unixTimeStamp();

  pool
    .query(
      `UPDATE "run" SET name = $1, slug = $2, is_active = $3, last_modified_by = $4, modified_date = $5 WHERE id = $6 RETURNING *`,
      [name, slug, is_active, user.id, modified_date, id]
    )
    .then((results) => {
      response.status(200).json(results.rows[0]);
    })
    .catch((e) => {
      if (e.code == "23505") {
        return response
          .status(409)
          .json({ message: "An error occured. Execution already exists." });
      } else {
        next(e);
      }
    });
};

const deleteExecution = (request, response, next) => {
  auth.authorizeRequest(request, response, next);
  const id = parseInt(request.params.id);

  pool
    .query(`DELETE FROM "run" WHERE id = $1;`, [id])
    .then((results) => {
      response.status(200).send(`Test execution deleted with ID: ${id}`);
    })
    .catch((e) => {
      next(e);
    });
};

module.exports = {
  getExecutions,
  getActiveExecutions,
  getInactiveExecutions,
  getExecutionInfo,
  createExecution,
  updateExecution,
  deleteExecution,
};
