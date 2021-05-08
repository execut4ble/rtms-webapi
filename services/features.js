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

const getFeatures = (request, response, next) => {
  auth.authorizeRequest(request, response, next);
  pool
    .query(
      `SELECT *, (SELECT COUNT(*) 
      FROM "testcase" 
      WHERE testcase.feature = feature.id) AS testcases,
      (SELECT COUNT(*) FROM defect WHERE defect.feature = feature.id AND defect.is_active = true) AS defects 
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

const getFeatureInfo = (request, response, next) => {
  auth.authorizeRequest(request, response, next);
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
  const user = auth.authorizeRequest(request, response, next);
  const created_date = timestamp.unixTimeStamp();

  pool
    .query(
      `INSERT INTO "feature" (name, description, sprint, ticket, slug, created_by, created_date) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, description, sprint, ticket, slug, user.id, created_date]
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
  const user = auth.authorizeRequest(request, response, next);
  const modified_date = timestamp.unixTimeStamp();

  pool
    .query(
      `UPDATE "feature" SET name = $1, description = $2, sprint = $3, ticket = $4, slug = $5, last_modified_by = $6, modified_date = $7 WHERE id = $8 RETURNING *`,
      [name, description, sprint, ticket, slug, user.id, modified_date, id]
    )
    .then((results) => {
      response.status(200).json(results.rows[0]);
    })
    .catch((e) => {
      next(e);
    });
};

const deleteFeature = (request, response, next) => {
  const id = parseInt(request.params.id);
  auth.authorizeRequest(request, response, next);

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
