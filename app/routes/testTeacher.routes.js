const express = require('express');
const router = express.Router();
const testTeacherController = require('../controllers/testTeacher.controller');
const checkAuth = require("../utils/validators/authCheck")


router.get('/',       checkAuth,  testTeacherController.findAll);
router.get('/:id',    checkAuth,  testTeacherController.getTestTeacher);
router.delete('/:id', checkAuth,  testTeacherController.deleteOne);

module.exports = router;