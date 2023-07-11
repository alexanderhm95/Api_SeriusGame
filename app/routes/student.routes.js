const express = require('express');
const router = express.Router();
const checkAuth = require("../utils/validators/authCheck")
const studentController = require('../controllers/student.controller');
const { cacheInit } = require("../utils/helpers/handle.cache")

router.post('/',    checkAuth(['DECE','ADMIN']), studentController.createStudent);
router.get('/',     checkAuth(['DECE','ADMIN']), cacheInit, studentController.getStudents);
router.get('/:id',  checkAuth(['DECE','ADMIN']), studentController.getStudent);
router.put('/:id',  checkAuth(['DECE','ADMIN']), studentController.updateStudent);
router.delete('/:id', checkAuth(['DECE', 'ADMIN']), studentController.deleteStudent);
router.post('/generate', checkAuth(['DECE']), studentController.generatePassStudent);
router.post('/login', studentController.loginStudent);

module.exports = router;