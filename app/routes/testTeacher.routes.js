const express = require('express');
const router = express.Router();
const testTeacherController = require('../controllers/testTeacher.controller');
const checkAuth = require("../utils/validators/authCheck")
const { cacheInit } = require("../utils/helpers/handle.cache")

router.get('/',       checkAuth(['ADMIN','DECE','TEACHER']), cacheInit, testTeacherController.findAll);
router.get('/:id',    checkAuth(['ADMIN','DECE','TEACHER']),  testTeacherController.getTestTeacher);
router.delete('/:id', checkAuth(['ADMIN','DECE','TEACHER']),  testTeacherController.deleteOne);

module.exports = router;