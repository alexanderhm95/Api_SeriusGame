const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const checkAuth = require("../utils/validators/authCheck")


router.post('/',       checkAuth, userController.createUser);
router.get('/',        checkAuth, userController.getUsers);
router.get('/:id',     checkAuth, userController.getUser);
router.put('/:id',     checkAuth, userController.updateUser);
router.post('/status', checkAuth, userController.updateUserStatus);
router.delete('/:id',  checkAuth, userController.deleteUser);

module.exports = router;