const express = require("express");
const db = require("../services/testcases");
const router = express.Router();

// Test cases
router.get("/:id", db.getTestcases);
router.post("/:feature/", db.createTestcase);
router.put("/:feature/:id", db.updateTestcase);
router.delete("/:feature/:id", db.deleteTestcase);

module.exports = router;
