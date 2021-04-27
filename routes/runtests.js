const express = require("express");
const db = require("../services/runtests");
const router = express.Router();

// Tests in an execution
router.get("/:id", db.getRuntests);
router.post("/:id/", db.createRuntest);
router.put("/:run/:testcase", db.updateRuntest);
router.delete("/:run/:testcase", db.deleteRuntest);

module.exports = router;
