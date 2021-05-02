const express = require("express");
const db = require("../services/watchedRuns.js");
const router = express.Router();

// Watched executions
router.get("/", db.getWatched);
router.post("/:id", db.createWatched);
router.delete("/:id", db.deleteWatched);

module.exports = router;
