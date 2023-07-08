
const express = require('express');
const router = express.Router();    
const caseController = require('../controllers/caso.controller')
const checkAuth = require("../utils/validators/authCheck")

router.post('/',              checkAuth,  caseController.create);
router.post('/test/student',  checkAuth,  caseController.testStudent);
router.post('/test/teacher',  checkAuth,  caseController.testTeacher);
router.get('/casos/:id',      checkAuth,  caseController.findAll);
router.get('/:id',            checkAuth,  caseController.getCaso);
router.get('/teacher/:id',    checkAuth,  caseController.getAllStudentsXTeacher);
router.delete('/',            checkAuth,  caseController.deleteAll);
router.delete('/:id',         checkAuth,  caseController.delete);

module.exports = router;