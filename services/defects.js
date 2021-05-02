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

function unixTimeStamp() {
  return Math.floor(+new Date() / 1000);
}

const getDefects = (request, response, next) => {
  auth.authorizeRequest(request, response, next);
  pool
    .query(
      `SELECT defect.*, feature.name AS feature_name
      FROM "defect"
      INNER JOIN "feature" ON feature.id = feature 
      ORDER BY id ASC`
    )
    .then((results) => {
      response.status(200).json(results.rows);
    })
    .catch((e) => {
      next(e);
    });
};

const getOpenDefects = (request, response, next) => {
  auth.authorizeRequest(request, response, next);
  pool
    .query(
      `SELECT defect.*, feature.name AS feature_name
      FROM "defect"
      INNER JOIN "feature" ON feature.id = feature
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

const getClosedDefects = (request, response, next) => {
  auth.authorizeRequest(request, response, next);
  pool
    .query(
      `SELECT defect.*, feature.name AS feature_name
      FROM "defect"
      INNER JOIN "feature" ON feature.id = feature
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

const getDefectInfo = (request, response, next) => {
  auth.authorizeRequest(request, response, next);
  const id = parseInt(request.params.id);

  pool
    .query(
      `SELECT defect.*, created.username AS created_user, modified.username AS modified_user 
      FROM "defect" 
      INNER JOIN "user" AS created ON created_by = created.id 
      LEFT JOIN "user" AS modified ON last_modified_by = modified.id
      WHERE defect.id = $1 
      ORDER BY defect.id ASC`,
      [id]
    )
    .then((results) => {
      response.status(200).json(results.rows);
    })
    .catch((e) => {
      next(e);
    });
};

const createDefect = (request, response, next) => {
  const {
    feature,
    name,
    description,
    priority,
    ticket,
    is_active,
  } = request.body;
  const user = auth.authorizeRequest(request, response, next);
  const created_date = unixTimeStamp();

  pool
    .query(
      `INSERT INTO "defect" (feature, name, description, priority, ticket, created_by, created_date, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        feature,
        name,
        description,
        priority,
        ticket,
        user.id,
        created_date,
        is_active,
      ]
    )
    .then((results) => {
      response.status(201).json(results.rows[0]);
    })
    .catch((e) => {
      if (e.code == "23505") {
        next(new Error("An error occured. Defect already exists."));
      } else {
        next(e);
      }
    });
};

const updateDefect = (request, response, next) => {
  const id = parseInt(request.params.id);
  const {
    feature,
    name,
    description,
    priority,
    ticket,
    is_active,
  } = request.body;
  const user = auth.authorizeRequest(request, response, next);
  const modified_date = unixTimeStamp();

  pool
    .query(
      `UPDATE "defect" SET feature = $1, name = $2, description = $3, priority = $4, ticket = $5, last_modified_by = $6, modified_date = $7 WHERE id = $8 RETURNING *`,
      [feature, name, description, priority, ticket, user.id, modified_date, id]
    )
    .then((results) => {
      response.status(200).json(results.rows[0]);
    })
    .catch((e) => {
      next(e);
    });
};

const updateDefectState = (request, response, next) => {
  const id = parseInt(request.params.id);
  const { is_active } = request.body;
  const user = auth.authorizeRequest(request, response, next);
  const modified_date = unixTimeStamp();

  pool
    .query(
      `UPDATE "defect" SET is_active = $1, last_modified_by = $2, modified_date = $3 WHERE id = $4 RETURNING *`,
      [is_active, user.id, modified_date, id]
    )
    .then((results) => {
      response.status(200).json(results.rows[0]);
    })
    .catch((e) => {
      next(e);
    });
};

const deleteDefect = (request, response, next) => {
  const id = parseInt(request.params.id);
  auth.authorizeRequest(request, response, next);

  pool
    .query(`DELETE FROM "defect" WHERE id = $1`, [id])
    .then((results) => {
      response.status(200).send(`Defect deleted with ID: ${id}`);
    })
    .catch((e) => {
      next(e);
    });
};

module.exports = {
  getDefects,
  getOpenDefects,
  getClosedDefects,
  getDefectInfo,
  createDefect,
  updateDefect,
  updateDefectState,
  deleteDefect,
};
