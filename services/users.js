const config = require("../config.json");

const Pool = require("pg").Pool;
const pool = new Pool({
  user: config.pguser,
  host: config.pghost,
  database: config.pgdatabase,
  password: config.pgpassword,
  port: config.pgport,
});

const getUsers = (request, response, next) => {
  pool
    .query(`SELECT * FROM "user" ORDER BY id ASC`)
    .then((results) => {
      response.status(200).json(results.rows);
    })
    .catch((e) => {
      next(e);
    });
};

const getUserById = (request, response, next) => {
  const id = parseInt(request.params.id);

  pool
    .query(`SELECT * FROM "user" WHERE id = $1`, [id])
    .then((results) => {
      response.status(200).json(results.rows);
    })
    .catch((e) => {
      next(e);
    });
};

const createUser = (request, response, next) => {
  const { email, username } = request.body;

  pool
    .query(
      `INSERT INTO "user" (email, username) VALUES ($1, $2) RETURNING id`,
      [email, username]
    )
    .then((results) => {
      response.status(201).send(`User added with ID: ${results.rows[0].id}`);
    })
    .catch((e) => {
      if (e.code == "23505") {
        next(new Error("An error occured. User already exists."));
      } else {
        next(e);
      }
    });
};

const updateUser = (request, response, next) => {
  const id = parseInt(request.params.id);
  const { email, username } = request.body;

  pool
    .query(`UPDATE "user" SET email = $1, username = $2 WHERE id = $3`, [
      email,
      username,
      id,
    ])
    .then((results) => {
      response.status(200).send(`User modified with ID: ${id}`);
    })
    .catch((e) => {
      next(e);
    });
};

const deleteUser = (request, response, next) => {
  const id = parseInt(request.params.id);

  pool
    .query(`DELETE FROM "user" WHERE id = $1`, [id])
    .then((results) => {
      response.status(200).send(`User deleted with ID: ${id}`);
    })
    .catch((e) => {
      next(e);
    });
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
