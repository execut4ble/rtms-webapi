const config = require("../config.json");

const Pool = require("pg").Pool;
const pool = new Pool({
  user: config.pguser,
  host: config.pghost,
  database: config.pgdatabase,
  password: config.pgpassword,
  port: config.pgport,
});

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

const getFeatureInfo = (request, response, next) => {
  const id = parseInt(request.params.id);

  pool
    .query(
      `SELECT feature.*, created.username AS created_user, modified.username AS modified_user 
      FROM "feature" 
      INNER JOIN "user" AS created ON created_by = created.id 
      INNER JOIN "user" AS modified ON last_modified_by = modified.id
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
  const { name, slug, created_by } = request.body;

  pool
    .query(
      `INSERT INTO "feature" (name, slug, created_by) VALUES ($1, $2, $3) RETURNING id`,
      [name, slug, created_by]
    )
    .then((results) => {
      response.status(201).send(`Feature added with ID: ${results.rows[0].id}`);
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
  const { name, slug, last_modified_by } = request.body;

  pool
    .query(
      `UPDATE "feature" SET name = $1, slug = $2, last_modified_by = $3 WHERE id = $4`,
      [name, slug, last_modified_by, id]
    )
    .then((results) => {
      response.status(200).send(`Feature modified with ID: ${id}`);
    })
    .catch((e) => {
      next(e);
    });
};

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
