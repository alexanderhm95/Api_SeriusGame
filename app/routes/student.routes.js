const express = require('express');
const router = express.Router();
const checkAuth = require("../utils/validators/authCheck")
const studentController = require('../controllers/student.controller');

router.post('/', checkAuth, studentController.createStudent);
router.get('/', checkAuth ,studentController.getStudents);
router.get('/:id', checkAuth, studentController.getStudent);
router.put('/:id', checkAuth, studentController.updateStudent);
router.delete('/:id', checkAuth, studentController.deleteStudent);
router.post('/generate', checkAuth, studentController.generatePassStudent);
router.post('/login', studentController.loginStudent);

module.exports = router;