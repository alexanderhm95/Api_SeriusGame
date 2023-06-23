const express = require('express');
const router = express.Router();
const testQuestionController = require('../controllers/testQuestion.controller');

router.post('/', testQuestionController.create);
router.get('/', testQuestionController.findAll);
router.get('/:id', testQuestionController.findOne);
router.put('/:id', testQuestionController.update);
router.delete('/:id', testQuestionController.delete);
router.delete('/', testQuestionController.deleteAll);

module.exports = router;