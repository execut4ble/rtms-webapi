const express = require("express");
const db = require("../services/executions.js");
const router = express.Router();

// Test executions
router.get("/", db.getExecutions);
router.get("/:id", db.getExecutionInfo);
router.post("/", db.createExecution);
router.put("/:id", db.updateExecution);
router.delete("/:id", db.deleteExecution);

module.exports = router;
