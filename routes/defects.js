const express = require("express");
const db = require("../services/defects");
const router = express.Router();

// Defects
router.get("/", db.getDefects);
router.get("/:id", db.getDefectInfo);
router.post("/", db.createDefect);
router.put("/:id", db.updateDefect);
router.put("/:id/setstate", db.updateDefectState);
router.delete("/:id", db.deleteDefect);

module.exports = router;
