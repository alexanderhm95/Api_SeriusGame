const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacher.controller');
const checkAuth = require("../utils/validators/authCheck")


router.post('/',      checkAuth,  teacherController.createTeacher);
router.get('/',       checkAuth,  teacherController.getTeachers);
router.get('/:id',    checkAuth,  teacherController.getTeacher);
router.delete('/:id', checkAuth,  teacherController.deleteTeacher);
router.put('/:id',    checkAuth,  teacherController.updateTeacher);

module.exports = router;