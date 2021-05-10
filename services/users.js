const config = require("../config.json");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("../utils/authorizeRequest");

const Pool = require("pg").Pool;
const pool = new Pool({
  user: config.pguser,
  host: config.pghost,
  database: config.pgdatabase,
  password: config.pgpassword,
  port: config.pgport,
});

// TODO: Only allow authorized user to perform this action
const getUsers = (request, response, next) => {
  auth.authorizeRequest(request, response, next);
  pool
    .query(`SELECT * FROM "user" ORDER BY id ASC`)
    .then((results) => {
      response.status(200).json(results.rows);
    })
    .catch((e) => {
      next(e);
    });
};

const createUser = async (request, response, next) => {
  const { email, username, password } = request.body;

  pool
    .query(`SELECT email FROM "user" WHERE email = $1`, [email])
    .then((results) => {
      if (results.rows.length > 0) {
        return response
          .status(201)
          .json({ message: "The E-mail is already in use" });
      }
    })
    .catch((e) => {
      next(e);
    });

  const hashPass = await bcrypt.hash(password, 12);

  pool
    .query(
      `INSERT INTO "user" (email, username, password) VALUES ($1, $2, $3) RETURNING id`,
      [email, username, hashPass]
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

const updateUser = async (request, response, next) => {
  const user = auth.authorizeRequest(request, response, next);
  const { email, username, password } = request.body;
  const hashPass = await bcrypt.hash(password, 12);

  pool
    .query(
      `UPDATE "user" SET email = $1, username = $2, password = $3 WHERE id = $4`,
      [email, username, hashPass, user.id]
    )
    .then((results) => {
      response.status(200).send(`User modified with ID: ${user.id}`);
    })
    .catch((e) => {
      next(e);
    });
};

const deleteUser = (request, response, next) => {
  auth.authorizeRequest(request, response, next);
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

const loginUser = (request, response, next) => {
  const { email, password } = request.body;

  pool
    .query(`SELECT * FROM "user" WHERE email = $1`, [email])
    .then(async (results) => {
      if (results.rows.length === 0) {
        return response.status(422).json({ message: "Invalid email address" });
      }
      const passMatch = await bcrypt.compare(
        password,
        results.rows[0].password
      );

      if (!passMatch) {
        return response.status(422).json({
          message: "Incorrect password",
        });
      }
      const token = jwt.sign({ id: results.rows[0].id }, config.jwtsecret, {
        expiresIn: "4h",
      });
      return response.json({
        token: token,
      });
    })
    .catch((e) => {
      next(e);
    });
};

const getUser = (request, response, next) => {
  const user = auth.authorizeRequest(request, response, next);

  pool
    .query(`SELECT * FROM "user" WHERE id = $1`, [user.id])
    .then((results) => {
      if (results.rows.length > 0) {
        response.status(200).json(results.rows[0]);
      }
    })
    .catch((e) => {
      next(e);
    });
};

module.exports = {
  getUsers,
  loginUser,
  createUser,
  updateUser,
  deleteUser,
  getUser,
};
