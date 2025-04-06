const logger = require('../../services/logger');
const { Database } = require('../../services/db');
const { postExpenseValidator, putExpenseValidator, deleteExpenseValidator } = require('../../validation/dashboard/expenses');

const getExpenses = async (req, res) => {
    try {
        const DB = new Database();
        const expenses = await DB.query(`SELECT * FROM expenses WHERE user_id = ${req.user.user_id};`);
        DB.close();
        return res.status(200).json({
            success: true,
            expenses
        });
    } catch (err) {
        logger.error(err.stack);
        return res.status(500).json({
            success: false,
            message: err
        });
    }
};

// Hardcoded category map: category_id, name, and keywords
const categoryMap = [
    { id: 1, name: 'Food', keywords: ['food', 'lunch', 'dinner', 'snacks'] },
    { id: 2, name: 'Travel', keywords: ['travel', 'uber', 'taxi', 'bus', 'train', 'flight'] },
    { id: 3, name: 'Rent', keywords: ['rent', 'lease'] },
    { id: 4, name: 'Grocery', keywords: ['grocery', 'vegetables', 'fruits'] },
    { id: 5, name: 'Entertainment', keywords: ['movie', 'netflix', 'party', 'entertainment'] },
    { id: 6, name: 'Fitness', keywords: ['gym', 'fitness', 'workout'] }
];

// Match based on notes content
const getCategoryIdFromNotes = (notes) => {
    const lowerNotes = notes.toLowerCase();
    for (const category of categoryMap) {
        if (category.keywords.some(keyword => lowerNotes.includes(keyword))) {
            return category.id;
        }
    }
    return 0; // Default to category_id 0 if no match
};

const postExpense = async (req, res) => {
    try {
        const error = postExpenseValidator(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error
            });
        }

        const { amount, notes, date } = req.body;
        const user_id = req.user.user_id;
        const category_id = getCategoryIdFromNotes(notes);

        // Get first day of the month: YYYY-MM-01
        const month = date.slice(0, 7) + '-01';

        const DB = new Database();

        // Insert into expenses
        await DB.query(
            `INSERT INTO expenses (user_id, category_id, amount, notes, date_of_txn, timestamp)
             VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP);`,
            [user_id, category_id, amount, notes, date]
        );

        // Check if a monthly_expense record already exists
        const existing = await DB.query(
            `SELECT id, expenditure FROM monthly_expense 
             WHERE user_id = ? AND category_id = ? AND month = ? LIMIT 1;`,
            [user_id, category_id, month]
        );

        if (existing.length > 0) {
            // Update existing expenditure
            const newExpenditure = parseFloat(existing[0].expenditure) + parseFloat(amount);
            await DB.query(
                `UPDATE monthly_expense SET expenditure = ?
                 WHERE id = ?;`,
                [newExpenditure, existing[0].id]
            );
        } else {
            // Insert new monthly_expense record
            await DB.query(
                `INSERT INTO monthly_expense (user_id, category_id, month, expenditure)
                 VALUES (?, ?, ?, ?);`,
                [user_id, category_id, month, amount]
            );
        }

        DB.close();

        return res.status(201).json({
            success: true,
            message: 'Expense added successfully',
            category_id_assigned: category_id
        });

    } catch (err) {
        logger.error(err.stack);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const putExpense = async (req, res) => {
    try {
        const error = putExpenseValidator(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error
            });
        }

        const { expense_id, amount, notes, date } = req.body;
        const user_id = req.user.user_id;
        const newCategoryId = getCategoryIdFromNotes(notes);
        const newMonth = date.slice(0, 7) + '-01';
        const newAmount = parseFloat(amount);

        const DB = new Database();

        // Get existing expense
        const existingExpense = await DB.query(
            `SELECT * FROM expenses WHERE id = ? AND user_id = ? LIMIT 1;`,
            [expense_id, user_id]
        );

        if (existingExpense.length === 0) {
            DB.close();
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        const oldExpense = existingExpense[0];
        const oldAmount = parseFloat(oldExpense.amount);
        const oldCategoryId = oldExpense.category_id;
        const oldDate = oldExpense.date_of_txn;
        const oldMonth = new Date(oldDate).toISOString().slice(0, 7) + '-01';

        // Update expense row
        await DB.query(
            `UPDATE expenses 
             SET amount = ?, notes = ?, date_of_txn = ?, category_id = ?
             WHERE id = ?;`,
            [newAmount, notes, date, newCategoryId, expense_id]
        );

        // CASE 1: Same month
        if (oldMonth === newMonth) {
            if (oldCategoryId === newCategoryId) {
                const diff = newAmount - oldAmount;
                await DB.query(
                    `UPDATE monthly_expense 
                     SET expenditure = expenditure + ?
                     WHERE user_id = ? AND category_id = ? AND month = ?;`,
                    [diff, user_id, newCategoryId, newMonth]
                );
            } else {
                // Subtract from old category
                await DB.query(
                    `UPDATE monthly_expense 
                     SET expenditure = expenditure - ?
                     WHERE user_id = ? AND category_id = ? AND month = ?;`,
                    [oldAmount, user_id, oldCategoryId, newMonth]
                );

                // Add to new category
                const newMonthly = await DB.query(
                    `SELECT id FROM monthly_expense 
                     WHERE user_id = ? AND category_id = ? AND month = ? LIMIT 1;`,
                    [user_id, newCategoryId, newMonth]
                );

                if (newMonthly.length > 0) {
                    await DB.query(
                        `UPDATE monthly_expense 
                         SET expenditure = expenditure + ?
                         WHERE id = ?;`,
                        [newAmount, newMonthly[0].id]
                    );
                } else {
                    await DB.query(
                        `INSERT INTO monthly_expense (user_id, category_id, month, expenditure)
                         VALUES (?, ?, ?, ?);`,
                        [user_id, newCategoryId, newMonth, newAmount]
                    );
                }
            }
        } else {
            // CASE 2: Month changed

            // Subtract old amount from old month
            await DB.query(
                `UPDATE monthly_expense 
                 SET expenditure = expenditure - ?
                 WHERE user_id = ? AND category_id = ? AND month = ?;`,
                [oldAmount, user_id, oldCategoryId, oldMonth]
            );

            // Add new amount to new month/category
            const existingNewMonth = await DB.query(
                `SELECT id FROM monthly_expense 
                 WHERE user_id = ? AND category_id = ? AND month = ? LIMIT 1;`,
                [user_id, newCategoryId, newMonth]
            );

            if (existingNewMonth.length > 0) {
                await DB.query(
                    `UPDATE monthly_expense 
                     SET expenditure = expenditure + ?
                     WHERE id = ?;`,
                    [newAmount, existingNewMonth[0].id]
                );
            } else {
                await DB.query(
                    `INSERT INTO monthly_expense (user_id, category_id, month, expenditure)
                     VALUES (?, ?, ?, ?);`,
                    [user_id, newCategoryId, newMonth, newAmount]
                );
            }
        }

        DB.close();

        return res.status(200).json({
            success: true,
            message: 'Expense updated successfully',
            new_category_id: newCategoryId
        });

    } catch (err) {
        logger.error(err.stack);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const deleteExpense = async (req, res) => {
    try {
        const error = deleteExpenseValidator(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error
            });
        }

        const { expense_id } = req.body;
        const user_id = req.user.user_id;

        const DB = new Database();

        // Fetch the expense to get amount, date, category_id
        const result = await DB.query(
            `SELECT amount, category_id, date_of_txn FROM expenses 
             WHERE id = ? AND user_id = ? LIMIT 1;`,
            [expense_id, user_id]
        );

        if (result.length === 0) {
            DB.close();
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        const { amount, category_id, date_of_txn } = result[0];
        const month = new Date(date_of_txn).toISOString().slice(0, 7) + '-01';

        // Delete from expenses
        await DB.query(
            `DELETE FROM expenses WHERE id = ? AND user_id = ?;`,
            [expense_id, user_id]
        );

        // Subtract from monthly_expense
        await DB.query(
            `UPDATE monthly_expense 
             SET expenditure = expenditure - ?
             WHERE user_id = ? AND category_id = ? AND month = ?;`,
            [amount, user_id, category_id, month]
        );

        DB.close();

        return res.status(200).json({
            success: true,
            message: 'Expense deleted successfully'
        });

    } catch (err) {
        logger.error(err.stack);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

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
    getExpenses,
    postExpense,
    putExpense,
    deleteExpense,
    getBudgetSummary,
    getUserBehaviorScore
};