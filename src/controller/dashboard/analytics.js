const logger = require('../../services/logger');
const { Database } = require('../../services/db');

const getBudgetSummary = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const inputMonth = req.query.month; // format: YYYY-MM
        const month = (inputMonth || new Date().toISOString().slice(0, 7)) + '-01';

        const DB = new Database();

        // Get all category budgets for the user
        const budgetData = await DB.query(
            `SELECT cb.category_id, cb.budget_amount, c.name as category_name
             FROM category_budget cb
             JOIN category c ON c.id = cb.category_id
             WHERE cb.user_id = ?;`,
            [user_id]
        );

        // Get actual expenses for the month
        const actualData = await DB.query(
            `SELECT category_id, expenditure
             FROM monthly_expense
             WHERE user_id = ? AND month = ?;`,
            [user_id, month]
        );

        DB.close();

        // Map actual expenses by category_id
        const actualMap = {};
        actualData.forEach(item => {
            actualMap[item.category_id] = parseFloat(item.expenditure);
        });

        // Merge budget + actual into final response
        const summary = budgetData.map(item => ({
            category_id: item.category_id,
            category_name: item.category_name,
            budget: parseFloat(item.budget_amount),
            actual: actualMap[item.category_id] || 0
        }));

        // Split into over and under budget
        const over_budget = summary.filter(item => item.actual > item.budget);
        const under_budget = summary.filter(item => item.actual <= item.budget);

        return res.status(200).json({
            success: true,
            month,
            summary,
            over_budget,
            under_budget
        });

    } catch (err) {
        logger.error(err.stack);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const getUserBehaviorScore = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const inputMonth = req.query.month; // format: YYYY-MM
        const month = (inputMonth || new Date().toISOString().slice(0, 7)) + '-01';
        const currentMonth = new Date(month);
        const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();

        const DB = new Database();

        // --- Budget adherence ---
        const budgets = await DB.query(
            `SELECT cb.category_id, cb.budget_amount
             FROM category_budget cb
             WHERE cb.user_id = ?;`,
            [user_id]
        );
        
        const actuals = await DB.query(
            `SELECT category_id, expenditure
             FROM monthly_expense
             WHERE user_id = ? AND month = ?;`,
            [user_id, month]
        );
        
        // Map actual expenses by category_id
        const actualMap = {};
        actuals.forEach(a => {
            actualMap[a.category_id] = parseFloat(a.expenditure);
        });
        
        let adherenceScore = 0;
        let totalCategories = budgets.length;
        
        budgets.forEach(b => {
            const budget = parseFloat(b.budget_amount);
            const actual = actualMap[b.category_id] || 0;
        
            if (budget === 0) {
                // If there's no budget but expenses exist, penalize fully
                adherenceScore += actual === 0 ? 1 : 0;
            } else if (actual <= budget) {
                adherenceScore += 1; // Full score
            } else {
                const penaltyRatio = Math.min((actual - budget) / budget, 1); // Cap at 100%
                adherenceScore += 1 - penaltyRatio;
            }
        });
        
        const adherencePercentage = totalCategories === 0
            ? 100
            : (adherenceScore / totalCategories) * 100;
        
        const adherenceWeighted = adherencePercentage * 0.3; // 30% weight

        // --- Frequency of usage ---
        const freqResult = await DB.query(
            `SELECT COUNT(DISTINCT DATE(date_of_txn)) as active_days
             FROM expenses
             WHERE user_id = ? AND DATE_FORMAT(date_of_txn, '%Y-%m-01') = ?;`,
            [user_id, month]
        );
        const activeDays = freqResult[0]?.active_days || 0;
        const frequencyPercentage = (activeDays / daysInMonth) * 100;
        const frequencyWeighted = frequencyPercentage * 0.3; // 30% weight

        // --- Expense tracking discipline ---
        const disciplineResult = await DB.query(
            `SELECT DATE(date_of_txn) as txn_date, DATE(timestamp) as log_date
            FROM expenses
            WHERE user_id = ? AND DATE_FORMAT(date_of_txn, '%Y-%m-01') = ?;`,
            [user_id, month]
        );

        const uniqueDaysMap = new Map();

        disciplineResult.forEach(row => {
            const txnDate = row.txn_date;
            const logDate = row.log_date;

            // Only count once per txn day
            if (!uniqueDaysMap.has(txnDate)) {
                uniqueDaysMap.set(txnDate, logDate > txnDate ? 'delayed' : 'on-time');
            }
        });

        const totalTrackedDays = uniqueDaysMap.size;
        const delayedDays = Array.from(uniqueDaysMap.values()).filter(status => status === 'delayed').length;

        const disciplinePercentage = totalTrackedDays === 0
            ? 0
            : ((totalTrackedDays - delayedDays) / totalTrackedDays) * 100;

        const disciplineWeighted = disciplinePercentage * 0.4; // 40% weight

        const finalScore = Math.round(adherenceWeighted + frequencyWeighted + disciplineWeighted);

        DB.close();

        return res.status(200).json({
            success: true,
            month,
            score: finalScore,
            breakdown: {
                adherence: Math.round(adherencePercentage),
                frequency: Math.round(frequencyPercentage),
                discipline: Math.round(disciplinePercentage)
            }
        });

    } catch (err) {
        logger.error(err.stack);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    getBudgetSummary,
    getUserBehaviorScore
};