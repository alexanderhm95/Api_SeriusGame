
const express = require('express');
const router = express.Router();    
const caseController = require('../controllers/caso.controller')

router.post('/', caseController.create);
router.post('/test/student', caseController.testStudent);
router.post('/test/teacher', caseController.testTeacher);
router.get('/', caseController.findAll);
router.get('/:id', caseController.getCaso);
router.get('/teacher/:id', caseController.getAllStudentsXTeacher);
router.delete('/', caseController.deleteAll);
router.delete('/:id', caseController.delete);

module.exports = router;