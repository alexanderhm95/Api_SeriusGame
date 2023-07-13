const express = require("express");
const router = express.Router();
const testStudentController = require("../controllers/testStudent.controller");
const checkAuth = require("../utils/validators/authCheck")


router.get("/",          checkAuth(['ADMIN','DECE','STUDENT']),   testStudentController.findAll);
router.get("/:id",       checkAuth(['ADMIN','DECE','STUDENT']),   testStudentController.getTestStudent);
router.get("/reporte/:id",         testStudentController.getTestStudentReport);
router.put("/score/:id", checkAuth(['DECE',]),   testStudentController.scoreUpdate);
router.delete("/:id",    checkAuth(['DECE']),   testStudentController.deleteOne);
router.delete("/",       checkAuth(['DECE']),   testStudentController.deleteAll);

module.exports = router;