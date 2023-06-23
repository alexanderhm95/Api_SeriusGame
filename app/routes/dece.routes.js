const express = require('express');
const router = express.Router();
const deceController = require('../controllers/dece.controller');

router.post('/', deceController.createDece)
.get('/', deceController.getDeces)
.get('/:id', deceController.getDece)
.put('/:id', deceController.updateDece)
.delete('/:id', deceController.deleteDece);


module.exports = router;
