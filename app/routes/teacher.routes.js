const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacher.controller');

router.post('/', teacherController.createTeacher);
router.get('/', teacherController.getTeachers);
router.get('/:id', teacherController.getTeacher);
router.delete('/:id', teacherController.deleteTeacher);
router.put('/:id', teacherController.updateTeacher);

module.exports = router;