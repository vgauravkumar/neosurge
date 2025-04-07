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
        const month = date.slice(0, 7) + '-01';

        const DB = new Database();

        // Insert into expenses and get inserted ID
        const insertResult = await DB.query(
            `INSERT INTO expenses (user_id, category_id, amount, notes, date_of_txn, timestamp)
             VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP);`,
            [user_id, category_id, amount, notes, date]
        );

        const expense_id = insertResult.insertId;

        // Check if a monthly_expense record already exists
        const existing = await DB.query(
            `SELECT id, expenditure FROM monthly_expense 
             WHERE user_id = ? AND category_id = ? AND month = ? LIMIT 1;`,
            [user_id, category_id, month]
        );

        if (existing.length > 0) {
            const newExpenditure = parseFloat(existing[0].expenditure) + parseFloat(amount);
            await DB.query(
                `UPDATE monthly_expense SET expenditure = ?
                 WHERE id = ?;`,
                [newExpenditure, existing[0].id]
            );
        } else {
            await DB.query(
                `INSERT INTO monthly_expense (user_id, category_id, month, expenditure)
                 VALUES (?, ?, ?, ?);`,
                [user_id, category_id, month, amount]
            );
        }

        // ✅ Store the action for possible reversal
        await DB.query(
            `REPLACE INTO last_user_action (user_id, action_type, payload)
             VALUES (?, 'add', ?);`,
            [user_id, JSON.stringify({
                expense_id,
                amount,
                notes,
                date,
                category_id
            })]
        );

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
        const oldNotes = oldExpense.notes;
        const oldMonth = new Date(oldDate).toISOString().slice(0, 7) + '-01';

        // ✅ Log the current state before applying the update
        await DB.query(
            `REPLACE INTO last_user_action (user_id, action_type, payload)
             VALUES (?, 'update', ?);`,
            [user_id, JSON.stringify({
                expense_id,
                old: {
                    amount: oldAmount,
                    notes: oldNotes,
                    date: oldDate,
                    category_id: oldCategoryId
                },
                new: {
                    amount: newAmount,
                    notes,
                    date,
                    category_id: newCategoryId
                }
            })]
        );

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

        // Fetch the full expense
        const result = await DB.query(
            `SELECT amount, category_id, date_of_txn, notes FROM expenses 
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

        const { amount, category_id, date_of_txn, notes } = result[0];
        const month = new Date(date_of_txn).toISOString().slice(0, 7) + '-01';

        // ✅ Log the delete action before actually deleting
        await DB.query(
            `REPLACE INTO last_user_action (user_id, action_type, payload)
             VALUES (?, 'delete', ?);`,
            [user_id, JSON.stringify({
                expense_id,
                amount,
                category_id,
                date: date_of_txn,
                notes
            })]
        );

        // Delete the expense
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

const reverseLastAction = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const DB = new Database();

        const lastAction = await DB.query(
            `SELECT action_type, payload FROM last_user_action
             WHERE user_id = ? LIMIT 1;`,
            [user_id]
        );

        if (lastAction.length === 0) {
            DB.close();
            return res.status(404).json({ success: false, message: 'No action to reverse.' });
        }

        const { action_type, payload } = lastAction[0];
        const data = JSON.parse(payload);

        if (action_type === 'add') {
            const { amount, notes, date, category_id } = data;
            const month = date.slice(0, 7) + '-01';

            // Delete the last inserted expense matching these details
            await DB.query(
                `DELETE FROM expenses
                 WHERE user_id = ? AND amount = ? AND notes = ? AND date_of_txn = ?
                 ORDER BY timestamp DESC LIMIT 1;`,
                [user_id, amount, notes, date]
            );

            // Subtract from monthly_expense
            await DB.query(
                `UPDATE monthly_expense
                 SET expenditure = expenditure - ?
                 WHERE user_id = ? AND category_id = ? AND month = ?;`,
                [amount, user_id, category_id, month]
            );
        }

        else if (action_type === 'update') {
            const { expense_id, old, new: newData } = data;

            const oldMonth = old.date.slice(0, 7) + '-01';
            const newMonth = newData.date.slice(0, 7) + '-01';

            // Revert the expense
            await DB.query(
                `UPDATE expenses
                 SET amount = ?, notes = ?, category_id = ?, date_of_txn = ?
                 WHERE id = ? AND user_id = ?;`,
                [old.amount, old.notes, old.category_id, old.date, expense_id, user_id]
            );

            // Adjust monthly_expense
            if (oldMonth === newMonth) {
                if (old.category_id === newData.category_id) {
                    const diff = old.amount - newData.amount;
                    await DB.query(
                        `UPDATE monthly_expense 
                         SET expenditure = expenditure + ?
                         WHERE user_id = ? AND category_id = ? AND month = ?;`,
                        [diff, user_id, old.category_id, oldMonth]
                    );
                } else {
                    // Reverse category switch in same month
                    await DB.query(
                        `UPDATE monthly_expense 
                         SET expenditure = expenditure + ?
                         WHERE user_id = ? AND category_id = ? AND month = ?;`,
                        [old.amount, user_id, old.category_id, oldMonth]
                    );
                    await DB.query(
                        `UPDATE monthly_expense 
                         SET expenditure = expenditure - ?
                         WHERE user_id = ? AND category_id = ? AND month = ?;`,
                        [newData.amount, user_id, newData.category_id, newMonth]
                    );
                }
            } else {
                // Revert across different months
                await DB.query(
                    `UPDATE monthly_expense 
                     SET expenditure = expenditure + ?
                     WHERE user_id = ? AND category_id = ? AND month = ?;`,
                    [old.amount, user_id, old.category_id, oldMonth]
                );
                await DB.query(
                    `UPDATE monthly_expense 
                     SET expenditure = expenditure - ?
                     WHERE user_id = ? AND category_id = ? AND month = ?;`,
                    [newData.amount, user_id, newData.category_id, newMonth]
                );
            }
        }

        else if (action_type === 'delete') {
            const { expense_id, amount, category_id, date } = data;
            const month = date.slice(0, 7) + '-01';

            // Reinsert expense (notes might not be tracked, set as empty or add to payload if needed)
            await DB.query(
                `INSERT INTO expenses (id, user_id, category_id, amount, notes, date_of_txn, timestamp)
                 VALUES (?, ?, ?, ?, '', ?, CURRENT_TIMESTAMP);`,
                [expense_id, user_id, category_id, amount, date]
            );

            await DB.query(
                `UPDATE monthly_expense
                 SET expenditure = expenditure + ?
                 WHERE user_id = ? AND category_id = ? AND month = ?;`,
                [amount, user_id, category_id, month]
            );
        }

        // Clear the last action
        await DB.query(`DELETE FROM last_user_action WHERE user_id = ?;`, [user_id]);

        DB.close();

        return res.status(200).json({
            success: true,
            message: `Successfully reversed last '${action_type}' action`
        });

    } catch (err) {
        logger.error(err.stack);
        return res.status(500).json({
            success: false,
            message: 'Failed to reverse last action'
        });
    }
};

module.exports = {
    getExpenses,
    postExpense,
    putExpense,
    deleteExpense,
    reverseLastAction
};