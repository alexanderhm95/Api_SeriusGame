const express = require('express');
const router = express.Router();

const studentController = require('../controllers/student.controller');

router.post('/', studentController.createStudent);
router.get('/', studentController.getStudents);
router.get('/:id', studentController.getStudent);
router.put('/:id', studentController.updateStudent);
router.delete('/:id', studentController.deleteStudent);
router.post('/generate', studentController.generatePassStudent);
router.post('/login', studentController.loginStudent);

module.exports = router;