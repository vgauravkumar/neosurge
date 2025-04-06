const router = require('express').Router();
const { register } = require('../../controller/authenticationModule/register');
const { login } = require('../../controller/authenticationModule/login');
const { verify } = require('../../controller/authenticationModule/verify');

router.post('/register', register);
router.post('/login', login);
router.post('/verify', verify);

module.exports = router;