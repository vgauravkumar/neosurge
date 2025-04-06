const { nodeSchedule } = require("../../app");
const Database = require("./db");
const logger = require("./logger");

// 🔔 Notify users who haven't logged expenses in the last 5 days
const inactiveUsers = async () => {
    try {
        const DB = new Database();

        const result = await DB.query(`
            SELECT u.user_id
            FROM users u
            LEFT JOIN (
                SELECT user_id, MAX(date_of_txn) AS last_txn
                FROM expenses
                GROUP BY user_id
            ) e ON u.user_id = e.user_id
            WHERE e.last_txn IS NULL OR e.last_txn < CURDATE() - INTERVAL 5 DAY;
        `);

        result.forEach(user => {
            logger.info(`📭 [INACTIVE] User ${user.user_id} has not logged any expenses in the last 5 days.`);
        });

        DB.close();
    } catch (err) {
        logger.error("Error in inactiveUsers cron:", err.stack);
    }
};

// 🔔 Notify users who overspent in any category this month
const overspentUsers = async () => {
    try {
        const DB = new Database();

        const currentMonth = new Date().toISOString().slice(0, 7) + '-01';

        const result = await DB.query(`
            SELECT me.user_id, me.category_id
            FROM monthly_expense me
            JOIN category_budget cb ON cb.user_id = me.user_id AND cb.category_id = me.category_id
            WHERE me.month = ? AND me.expenditure > cb.budget_amount;
        `, [currentMonth]);

        result.forEach(row => {
            logger.info(`⚠️ [OVERSPENT] User ${row.user_id} overspent in category ${row.category_id} for month ${currentMonth}.`);
        });

        DB.close();
    } catch (err) {
        logger.error("Error in overspentUsers cron:", err.stack);
    }
};

const jobs = () => {
    nodeSchedule.scheduleJob({ rule: '0 9 * * *', tz: 'Asia/Kolkata' }, async () => {
        inactiveUsers();
    });

    nodeSchedule.scheduleJob({ rule: '0 9 * * *', tz: 'Asia/Kolkata' }, async () => {
        overspentUsers();
    });
};

module.exports = {
    jobs
};