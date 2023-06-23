const express = require('express');
const router = express.Router();
const testTeacherController = require('../controllers/testTeacher.controller');

router.get('/', testTeacherController.findAll);
router.get('/:id', testTeacherController.getTestTeacher);
router.delete('/:id', testTeacherController.deleteOne);

module.exports = router;