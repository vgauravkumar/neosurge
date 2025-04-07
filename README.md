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
- **Database:** PostgreSQL
- **ORM:** Sequelize
- **Auth:** JWT, OTP (simulated)
- **Job Scheduler:** Node-cron
- **Docs:** Swagger

---

## 🛠️ Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/finance-tracker-api.git
   cd finance-tracker-api

	2.	Install Dependencies

npm install


	3.	Setup .env File

PORT=3000
DB_HOST=localhost
DB_USER=your_db_user
DB_PASS=your_db_password
DB_NAME=finance_tracker
JWT_SECRET=your_jwt_secret


	4.	Run Database Migrations

npx sequelize db:migrate


	5.	Start the Server

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

src/
│
├── controllers/
├── services/
├── models/
├── routes/
├── middlewares/
├── jobs/               # Notification engine (cron)
├── utils/              # OTP mock, scoring logic
├── config/
└── app.js



⸻

🧪 API Documentation
	•	Swagger available at: http://localhost:3000/api-docs
	•	Postman collection: Download here

⸻

🎥 Walkthrough Video

📹 walkthrough.mp4 included in repo
Explains architecture, folder structure, API flow, and scoring logic.

⸻

📘 Other Files
	•	design_notes.md: Detailed architecture, DB schema, and scoring logic.
	•	postman_collection.json: Import into Postman to test all endpoints.
	•	.env.example: Sample config file.

⸻

🏁 Author

Developed by Gaurav
For Backend System - Personal Finance Tracker API Assignment
