const express = require('express');
const router = express.Router();
const testQuestionController = require('../controllers/testQuestion.controller');
const checkAuth = require("../utils/validators/authCheck")

router.post('/',      checkAuth,  testQuestionController.create);
router.get('/',       checkAuth,  testQuestionController.findAll);
router.get('/:id',    checkAuth,  testQuestionController.findOne);
router.put('/:id',    checkAuth,  testQuestionController.update);
router.delete('/:id', checkAuth,  testQuestionController.delete);
router.delete('/',    checkAuth,  testQuestionController.deleteAll);

module.exports = router;