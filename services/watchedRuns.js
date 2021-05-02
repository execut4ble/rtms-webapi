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

const getWatched = (request, response, next) => {
  const user = auth.authorizeRequest(request, response, next);
  pool
    .query(
      `SELECT *, 
      (SELECT COUNT(*) FROM testcase_RUN WHERE run_id = id) AS testcase_count,
      (SELECT COUNT(status) FROM testcase_run WHERE status = 'passed' AND run_id = id) AS passed, 
      (SELECT COUNT(status) FROM testcase_run WHERE status = 'failed' AND run_id = id) AS failed,
      (SELECT COUNT(status) FROM testcase_run WHERE status = 'tbd' AND run_id = id) AS tbd
      FROM run
	  LEFT JOIN "watched_run" AS watched ON run = id
	  WHERE watched.user = $1
      ORDER BY id ASC`,
      [user.id]
    )

    .then((results) => {
      response.status(200).json(results.rows);
    })
    .catch((e) => {
      next(e);
    });
};

const createWatched = (request, response, next) => {
  const id = parseInt(request.params.id);
  const user = auth.authorizeRequest(request, response, next);

  pool
    .query(
      `INSERT INTO watched_run(
        "user", run)
        VALUES ($1, $2);`,
      [user.id, id]
    )
    .then((results) => {
      response.status(201).json(results.rows[0]);
    })
    .catch((e) => {
      if (e.code == "23505") {
        next(
          new Error(
            "An error occured. Execution is already being watched by this user."
          )
        );
      } else {
        next(e);
      }
    });
};

const deleteWatched = (request, response, next) => {
  const user = auth.authorizeRequest(request, response, next);
  const id = parseInt(request.params.id);

  pool
    .query(`DELETE FROM "watched_run" WHERE run = $1 AND "user" = $2;`, [
      id,
      user.id,
    ])
    .then((results) => {
      response.status(200).send(`No longer watching execution with ID: ${id}`);
    })
    .catch((e) => {
      next(e);
    });
};

module.exports = {
  getWatched,
  createWatched,
  deleteWatched,
};
