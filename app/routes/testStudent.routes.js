const express = require("express");
const router = express.Router();
const testStudentController = require("../controllers/testStudent.controller");
const checkAuth = require("../utils/validators/authCheck")

router.get("/",          checkAuth,   testStudentController.findAll);
router.get("/:id",       checkAuth,   testStudentController.getTestStudent);
router.put("/score/:id", checkAuth,   testStudentController.scoreUpdate);
router.delete("/:id",    checkAuth,   testStudentController.deleteOne);
router.delete("/",       checkAuth,   testStudentController.deleteAll);

module.exports = router;
