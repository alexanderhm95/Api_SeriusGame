const express = require('express');
const router = express.Router();
const deceController = require('../controllers/dece.controller');
const checkAuth = require("../utils/validators/authCheck")
const { cacheInit } = require("../utils/helpers/handle.cache")


router.post('/',  checkAuth(['ADMIN']),  deceController.createDece)
.get('/',         checkAuth(['DECE','ADMIN']),cacheInit,  deceController.getDeces)
.get('/:id',      checkAuth(['DECE','ADMIN']),  deceController.getDece)
.put('/:id',      checkAuth(['ADMIN']),  deceController.updateDece)
.delete('/:id',   checkAuth(['ADMIN']),  deceController.deleteDece);


module.exports = router;
