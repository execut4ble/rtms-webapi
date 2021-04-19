const express = require("express");
const db = require("../services/features");
const router = express.Router();

// Features
router.get("/", db.getFeatures);
router.get("/:id", db.getFeatureInfo);
router.post("/", db.createFeature);
router.put("/:id", db.updateFeature);
router.delete("/:id", db.deleteFeature);

module.exports = router;
