const router = require('express').Router();
const { userDetail } = require('../../controller/dashboard/userDetail');
const passport = require('passport');

router.get('/userDetail', passport.authenticate('jwt', { session: false }), userDetail);

module.exports = router;