const express = require('express');
const router = express.Router();
const deceController = require('../controllers/dece.controller');
const checkAuth = require("../utils/validators/authCheck")


router.post('/',  checkAuth,  deceController.createDece)
.get('/',         checkAuth,  deceController.getDeces)
.get('/:id',      checkAuth,  deceController.getDece)
.put('/:id',      checkAuth,  deceController.updateDece)
.delete('/:id',   checkAuth,  deceController.deleteDece);


module.exports = router;
