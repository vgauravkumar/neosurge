const router = require('express').Router();
const { userDetail, userDetailAll } = require('../../controller/dashboard/userDetail');
const { userAccessOnly, adminAccessOnly } = require('../../middleware/authorization');
const passport = require('passport');

router.get('/userDetail', passport.authenticate('jwt', { session: false }), userAccessOnly, userDetail);
router.get('/allUserDetail', passport.authenticate('jwt', { session: false }), adminAccessOnly, userDetailAll);

module.exports = router;