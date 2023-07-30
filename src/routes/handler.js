const router = require('express').Router();

router.get('/api', (req, res) => {
    return res.status(200).json({
        success: true,
        message: `${process.env.ENVIORMENT} server is active`
    });
});

router.use('/api', require('./autenticationModule/handleAuthentication'));
router.use('/api', require('./dashboard/userDetail'));

module.exports = router;