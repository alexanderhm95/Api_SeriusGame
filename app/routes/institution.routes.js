const express = require('express');
const router = express.Router();
const institutionController = require('../controllers/institution.controller');

router.post('/', institutionController.createInstitution);
router.get('/', institutionController.getInstitutions);
router.get('/:id', institutionController.getInstitution);
router.put('/:id', institutionController.updateInstitution);
router.delete('/:id', institutionController.deleteInstitution);

module.exports = router;