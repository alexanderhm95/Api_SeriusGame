const { check } = require('express-validator');
const { validateFields } = require('../helpers/validate.helper');

const validateCreateUser = [
    check('person', 'Person is required').not().isEmpty(),
    check('password', 'Password is required').not().isEmpty().isLength({ min: 8, max: 16 }).exists(),
    check('role', 'Role is required').not().isEmpty(),
    (req, res, next) => {               
        validateFields(req, res, next);
    }
];

const validateUpdateUser = [
    check('person', 'Person is required').not().isEmpty(),
    check('password', 'Password is required').not().isEmpty().isLength({ min: 8, max: 16 }).exists(),
    check('role', 'Role is required').not().isEmpty(),
    (req, res, next) => {
        validateFields(req, res, next);
    }
];

module.exports = { validateCreateUser, validateUpdateUser };