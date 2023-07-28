const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller')
router.post('/login', authController.login);
router.post('/validate', authController.validate);
router.post('/recovery', authController.recoverPassword);
router.post('/reset', authController.changePassword);

module.exports = router;