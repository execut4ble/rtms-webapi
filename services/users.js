const config = require("../config.json");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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

// TODO: Only allow authorized user to perform this action
const updateUser = async (request, response, next) => {
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

  const { email, username, password } = request.body;

  const hashPass = await bcrypt.hash(password, 12);

  pool
    .query(
      `UPDATE "user" SET email = $1, username = $2, password = $3 WHERE id = $4`,
      [email, username, hashPass, decoded.id]
    )
    .then((results) => {
      response.status(200).send(`User modified with ID: ${decoded.id}`);
    })
    .catch((e) => {
      next(e);
    });
};

// TODO: Only allow authorized user to perform this action
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

const loginUser = (request, response, next) => {
  const { email, password } = request.body;

  pool
    .query(`SELECT * FROM "user" WHERE email = $1`, [email])
    .then(async (results) => {
      if (results.rows.length === 0) {
        return response.status(201).json({ message: "Invalid email address" });
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
        expiresIn: "1h",
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

  pool
    .query(`SELECT * FROM "user" WHERE id = $1`, [decoded.id])
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
