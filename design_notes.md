## Design Notes – Personal Finance Tracker Backend

⸻

1. Overview

This backend system powers a Personal Finance Tracker API designed to help users manage expenses, budgets, and improve financial discipline. It includes user onboarding, expense & budget tracking, behavior-based scoring, notifications, and a transaction ledger for reversals.

⸻

2. Tech Stack
	•	Backend: Node.js + Express
	•	Database: MySQL
	•	Scheduler: node-schedule
	•	SQL Interface: mysql2 npm package
	•	Authentication: JWT & OTP-based login/signup (mocked)

⸻

3. Architecture Overview

Express Server (API Endpoints) → MySQL Database ← Scheduled Notification Jobs (node-schedule)
Authentication Middleware and Expense Logic interact with the DB.
Notifications are logged via console.log for now.

⸻

4. Database Schema Design

Users:
	•	user_login – Auth-related info including email, OTP, and role.
	•	user_cred – Stores password hash.
	•	user_type allows role-based access (admin/user).

Expenses & Tags:
	•	expenses – Logs each user’s individual expense.
	•	tags & tag_map – Optional tagging for expenses.

Categories & Budgets:
	•	category – Expense category list.
	•	category_budget – Budget limits set per category by each user.
	•	monthly_expense – Tracks total spending per category per month per user.

Ledger System:
	•	last_user_action – Stores the last create/update/delete action per user for reversal purposes.

⸻

5. Expense Flow Logic
	•	Category is auto-determined via a heuristic keyword-based function: getCategoryIdFromNotes(notes).
	•	Updating an expense also updates the corresponding entry in monthly_expense.
	•	Adjustments depend on whether the category or the month has changed.
	•	Changes are logged in last_user_action so they can be reversed.

⸻

6. Behavior-Based Scoring Logic

Endpoint: /api/score?month=YYYY-MM

Returns a score out of 100, calculated as follows:
	1.	Budget Adherence (30%)
	•	Compares actual spend to category budgets.
	•	Full points if within budget. Score drops gradually when over budget.
	2.	Frequency of Usage (30%)
	•	Measures active days in a month where expenses were logged.
	•	More consistent usage means higher score.
	3.	Tracking Discipline (40%)
	•	Compares when an expense was logged vs when it occurred.
	•	Delays reduce the score.

Final score is the weighted sum of the three components as per the instructions given.
Each metric is modular to allow easy future expansion.

⸻

7. Notification Engine

Two cron jobs run daily using node-schedule:
	•	Inactivity Notifications:
Triggered if user hasn’t logged any expenses in the last 5 days.
	•	Budget Overrun Notifications:
Triggered if a user exceeds their category budget for the month.

Each notification is mocked by logging a structured JSON to the console.

Example:

{
  user_id: 12,
  type: 'overspend',
  category_id: 3,
  message: 'You have overspent in category Food.'
}



⸻

8. Reversal Mechanism
	•	Each create/update/delete on expenses is logged in last_user_action.
	•	A /reverseLastAction endpoint reads from this table and undoes the operation.
	•	No destructive changes occur — all reversals are additive or compensatory.
	•	Keeps the system recoverable and audit-friendly.

⸻

9. Security Measures
	•	Passwords are securely hashed using bcrypt.
	•	Role-based access using user_type (admin vs user).
	•	Basic audit trail via user_login table.
	•	OTP simulation is mocked (no real email or SMS integration).

⸻

10. Future Enhancements
	•	Replace mocked notification with actual services using queues (Redis + Firebase).
	•	Smarter auto-categorization via ML.
	•	Add charts/analytics endpoints.
	•	Email/SMS integration.
	•	Admin dashboards and reporting.
