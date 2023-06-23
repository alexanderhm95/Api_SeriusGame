const express = require('express');
const router = express.Router();
const testStudentController = require('../controllers/testStudent.controller');

router.get('/', testStudentController.findAll);
router.get('/:id', testStudentController.getTestStudent);
router.delete('/:id', testStudentController.deleteOne);
router.delete('/', testStudentController.deleteAll);

module.exports = router;