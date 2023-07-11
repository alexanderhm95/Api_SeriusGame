const express = require('express');
const router = express.Router();
const testQuestionController = require('../controllers/testQuestion.controller');
const checkAuth = require("../utils/validators/authCheck")
const { cacheInit } = require("../utils/helpers/handle.cache")

router.post('/',      checkAuth(['ADMIN','DECE']),  testQuestionController.create);
router.get('/',       checkAuth(['ADMIN','DECE','TEACHER']), cacheInit,  testQuestionController.findAll);
router.get('/:id',    checkAuth(['ADMIN','DECE']),  testQuestionController.findOne);
router.put('/:id',    checkAuth(['ADMIN','DECE']),  testQuestionController.update);
router.delete('/:id', checkAuth(['ADMIN','DECE']),  testQuestionController.delete);
router.delete('/',    checkAuth(['ADMIN','DECE']),  testQuestionController.deleteAll);

module.exports = router;