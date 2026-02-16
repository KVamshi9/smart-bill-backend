# Smart Bill Notifier — Automated EMI Reminder System (Backend)

A Node.js service that automatically sends recurring WhatsApp payment reminders using a rule-based scheduling engine.

Instead of storing one-time dates, the system stores **monthly payment rules** and evaluates them continuously in the background.

---

## Live API

https://smart-bill-backend-1.onrender.com

Health Check:
https://smart-bill-backend-1.onrender.com/health

---

## Core Idea

Each bill is stored as:

• Day of month
• Reminder time

A background scheduler checks every minute.
When the rule matches current time → WhatsApp reminder is sent.

The same record works forever without re-creating the bill.

---

## Features

• REST APIs for bills CRUD
• Automatic recurring monthly reminder logic
• WhatsApp notification delivery (Twilio)
• Duplicate reminder prevention
• Persistent MySQL storage
• Background cron scheduler
• Cloud deployment

---

## Architecture

Client (React UI) → REST API (Node.js) → MySQL Database
↓
Background Cron Scheduler
↓
WhatsApp Notification

---

## Reminder Logic

Every minute:

If
(current_day == due_day) AND
(current_time == reminder_time) AND
(month_not_already_triggered)

→ Send WhatsApp message
→ Update last_notified_month
→ Prevent duplicate alerts

This ensures reminders work even if frontend is closed.

---

## API Endpoints

GET /bills
POST /bills
PUT /bills/:id
DELETE /bills/:id
GET /health

---

## Database Schema

Table: `bills`

| Column              | Type       | Description                          |
| ------------------- | ---------- | ------------------------------------ |
| id                  | INT (PK)   | Unique bill identifier               |
| title               | VARCHAR    | Name of the bill                     |
| amount              | DECIMAL    | Payment amount                       |
| due_day             | INT        | Day of month (1–31)                  |
| reminder_time       | TIME       | Reminder trigger time                |
| phone               | VARCHAR    | WhatsApp recipient number            |
| message             | TEXT       | Notification message                 |
| last_notified_month | VARCHAR(7) | Prevents duplicate monthly reminders |
| created_at          | TIMESTAMP  | Record creation time                 |

### Design Decision

Instead of storing fixed future dates, the system stores rules (day + time).
This allows one database record to automatically repeat every month without duplication.

---

## Running Locally

Create `.env`

PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=emi_db
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_WHATSAPP_NUMBER=xxx

Install & run:

npm install
node server.js

---

## Tech Stack

Node.js
Express.js
MySQL
node-cron
Twilio WhatsApp API
Render Cloud Hosting

---

## Why Backend Scheduling

Reminder logic runs on server cron instead of frontend timers.

Reason:
Frontend timers stop when the browser closes.
Server scheduler guarantees reminders run continuously.

---

## Future Improvements

• Multi-user authentication
• Weekly/custom recurrence rules
• Email notifications
• Queue-based background worker
• Last-day-of-month intelligent handling

---

## Author

Vamshi K

Educational assignment project
