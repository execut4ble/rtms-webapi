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
const getFeatures = (request, response, next) => {
  pool
    .query(
      `SELECT *, (SELECT COUNT(*) 
        FROM "testcase" 
        WHERE testcase.feature = feature.id) AS testcases 
      FROM "feature" 
      ORDER BY id ASC`
    )
    .then((results) => {
      response.status(200).json(results.rows);
    })
    .catch((e) => {
      next(e);
    });
};

// TODO: Add authorization
const getFeatureInfo = (request, response, next) => {
  const id = parseInt(request.params.id);

  pool
    .query(
      `SELECT feature.*, created.username AS created_user, modified.username AS modified_user 
      FROM "feature" 
      INNER JOIN "user" AS created ON created_by = created.id 
      LEFT JOIN "user" AS modified ON last_modified_by = modified.id
      WHERE feature.id = $1 
      ORDER BY feature.id ASC`,
      [id]
    )
    .then((results) => {
      response.status(200).json(results.rows);
    })
    .catch((e) => {
      next(e);
    });
};

const createFeature = (request, response, next) => {
  const { name, description, sprint, ticket, slug } = request.body;

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

  const created_date = unixTimeStamp();

  pool
    .query(
      `INSERT INTO "feature" (name, description, sprint, ticket, slug, created_by, created_date) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, description, sprint, ticket, slug, decoded.id, created_date]
    )
    .then((results) => {
      response.status(201).json(results.rows[0]);
    })
    .catch((e) => {
      if (e.code == "23505") {
        next(new Error("An error occured. Feature already exists."));
      } else {
        next(e);
      }
    });
};

const updateFeature = (request, response, next) => {
  const id = parseInt(request.params.id);
  const { name, description, sprint, ticket, slug } = request.body;

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

  const modified_date = unixTimeStamp();

  pool
    .query(
      `UPDATE "feature" SET name = $1, description = $2, sprint = $3, ticket = $4, slug = $5, last_modified_by = $6, modified_date = $7 WHERE id = $8 RETURNING *`,
      [name, description, sprint, ticket, slug, decoded.id, modified_date, id]
    )
    .then((results) => {
      response.status(200).json(results.rows[0]);
    })
    .catch((e) => {
      next(e);
    });
};

// TODO: Add authorization
const deleteFeature = (request, response, next) => {
  const id = parseInt(request.params.id);

  pool
    .query(`DELETE FROM "feature" WHERE id = $1`, [id])
    .then((results) => {
      response.status(200).send(`Feature deleted with ID: ${id}`);
    })
    .catch((e) => {
      next(e);
    });
};

module.exports = {
  getFeatures,
  getFeatureInfo,
  createFeature,
  updateFeature,
  deleteFeature,
};
