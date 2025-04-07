📁 README.md

# 💰 Personal Finance Tracker API

A backend system built with **Node.js (Express.js)** and **PostgreSQL** to help users track their personal finances. The app includes user onboarding, expense management, budgeting, user behavioral scoring, and a notification engine with audit logs and transaction reversals.

---

## 🚀 Features

- JWT + OTP-based Authentication
- Role-based Access (User/Admin)
- Audit Logging for Login/Signup
- CRUD for Expenses & Budgets
- Auto-Categorization (Heuristic-based)
- Behavior-based Scoring (0-100)
- Notification Engine via Scheduled Jobs
- Transaction Ledger + Reversal System
- Modular Folder Structure
- Swagger Documentation

---

## 📦 Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MySQL
- **ORM:** Sequelize
- **Auth:** JWT, OTP (simulated)
- **Job Scheduler:** Node-cron
- **Docs:** Swagger

---

## 🛠️ Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone https://github.com/vgauravkumar/neosurge
   cd neosurge

	2.	Install Dependencies

npm install

	3.	Start the Server

npm run dev



⸻

📚 API Endpoints

🔐 Authentication

Method	Endpoint	Description
POST	/api/register	Register user
POST	/api/login	Login user
POST	/api/verify	Verify OTP (Mocked)



⸻

👤 User Management

Method	Endpoint	Description
GET	/api/userDetail	Get current user info
GET	/api/allUserDetail	Admin: all user details



⸻

💸 Expense Management

Method	Endpoint	Description
GET	/api/expenses	Get all user expenses
POST	/api/expenses	Create a new expense
PUT	/api/expenses	Update an expense
DELETE	/api/expenses	Delete an expense

Example Create Expense:

{
  "amount": 1250.75,
  "notes": "Bus ride to airport",
  "date": "2025-04-07"
}



⸻

📊 Budget & Summary

Method	Endpoint	Description
GET	/api/summary	Budget vs Actual summary
GET	/api/score	Get behavior score



⸻

🔁 Ledger & Reversal

Method	Endpoint	Description
GET	/api/reverseLastAction	Revert last expense op



⸻

🧠 Scoring Logic

A user behavior score is generated out of 100 based on:
	•	Budget Adherence (30%)
	•	Staying within monthly or category budgets.
	•	Frequency of Usage (30%)
	•	Logging in and updating expenses regularly.
	•	Expense Tracking Discipline (40%)
	•	Timely expense entries, minimal reversals, logical consistency.

Score is calculated via a modular function for future extensibility.

⸻

🔔 Notification Engine

A scheduled background job scans users:
	•	Who overspent in any budget category.
	•	Who haven’t logged expenses in over 5 days.

A mock notification is sent via JSON to a simulated endpoint.

{
  "user_id": 12,
  "type": "overspent",
  "message": "You have exceeded your 'Food' category limit!"
}



⸻

🧾 Audit & Reversals
	•	All expense operations (create, update, delete) are logged in a ledger.
	•	A user can call /reverseLastAction to rollback their last transaction non-destructively.

⸻

📂 Folder Structure

<img width="198" alt="image" src="https://github.com/user-attachments/assets/69d3dd16-5df9-4cab-8eeb-4131bb1da026" />




⸻

🧪 API Documentation
	•	Postman collection: Download here

⸻

📘 Other Files
	•	Postman: https://documenter.getpostman.com/view/16919567/2sB2cVdLvB

⸻

🏁 Author

Developed by Gaurav
For Backend System - Personal Finance Tracker API Assignment
