const router = require('express').Router();
const { register } = require('../../controller/authenticationModule/register');
const { login } = require('../../controller/authenticationModule/login');

router.post('/register', register);
router.post('/login', login);

module.exports = router;