const express = require('express');
const router = express.Router();
const institutionController = require('../controllers/institution.controller');
const checkAuth = require("../utils/validators/authCheck")

router.post('/',      checkAuth,  institutionController.createInstitution);
router.get('/',       checkAuth,  institutionController.getInstitutions);
router.get('/:id',    checkAuth,  institutionController.getInstitution);
router.put('/:id',    checkAuth,  institutionController.updateInstitution);
router.delete('/:id', checkAuth,  institutionController.deleteInstitution);

module.exports = router;