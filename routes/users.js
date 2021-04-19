const express = require("express");
const db = require("../services/users");
const router = express.Router();

router.get("/", db.getUsers);
router.get("/:id", db.getUserById);
router.post("/", db.createUser);
router.put("/:id", db.updateUser);
router.delete("/:id", db.deleteUser);

module.exports = router;
