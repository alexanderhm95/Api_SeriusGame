const express = require('express');
const router = express.Router();
const institutionController = require('../controllers/institution.controller');
const checkAuth = require("../utils/validators/authCheck")
const { cacheInit } = require("../utils/helpers/handle.cache")

router.post('/',      checkAuth(['ADMIN']),  institutionController.createInstitution);
router.get('/',       checkAuth(['ADMIN','DECE']), cacheInit, institutionController.getInstitutions);
router.get('/:id',    checkAuth(['ADMIN']),  institutionController.getInstitution);
router.put('/:id',    checkAuth(['ADMIN']),  institutionController.updateInstitution);
router.delete('/:id', checkAuth(['ADMIN']),  institutionController.deleteInstitution);

module.exports = router;