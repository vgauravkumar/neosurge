const router = require('express').Router();
const { getExpenses, postExpense, putExpense, deleteExpense, getBudgetSummary, getUserBehaviorScore } = require('../../controller/dashboard/expenses');
const { userAccessOnly } = require('../../middleware/authorization');
const passport = require('passport');

router.get('/expenses', passport.authenticate('jwt', { session: false }), userAccessOnly, getExpenses);
router.post('/expenses', passport.authenticate('jwt', { session: false }), userAccessOnly, postExpense);
router.put('/expenses', passport.authenticate('jwt', { session: false }), userAccessOnly, putExpense);
router.delete('/expenses', passport.authenticate('jwt', { session: false }), userAccessOnly, deleteExpense);

router.get('/summary', passport.authenticate('jwt', { session: false }), userAccessOnly, getBudgetSummary);
router.get('/score', passport.authenticate('jwt', { session: false }), userAccessOnly, getUserBehaviorScore);

module.exports = router;