const express = require("express");
const db = require("../services/users");
const router = express.Router();

router.get("/", db.getUsers);
router.get("/verify/", db.getUser);
router.put("/:id", db.updateUser);
router.delete("/:id", db.deleteUser);

router.post("/login", db.loginUser);
router.post("/register", db.createUser);

module.exports = router;
