# Smart Bill Notifier — Backend (Authenticated Automated Reminder API)

A Node.js cloud service that manages users and recurring bills, and automatically sends WhatsApp reminders using a background scheduler.

Instead of storing fixed future dates, the system stores **monthly payment rules** and evaluates them continuously — allowing reminders to run forever without user interaction.

---

## Live API

https://smart-bill-backend-1.onrender.com

Health Check
https://smart-bill-backend-1.onrender.com/health

---

## What This Backend Does

This server acts as an automation engine, not just a data API.

It:

• Authenticates users securely
• Stores bills per user
• Runs a scheduler every minute
• Sends WhatsApp reminders automatically
• Prevents duplicate alerts
• Works even if user closes browser

The frontend is only a control panel — automation lives here.

---

## Core Logic (Rule-Based Recurrence)

Each bill stores:

• due_day (1–31)
• reminder_time

Every minute the scheduler checks:

If
current_day == due_day
AND current_time == reminder_time
AND reminder not sent this month

→ Send WhatsApp reminder
→ Save month in `last_notified_month`

A single record repeats forever — no need to recreate bills monthly.

---

## Authentication

JWT based stateless authentication.

After login, each request must include:

Authorization: Bearer <token>

Server extracts `user_id` and filters all queries.
Users can only access their own bills.

---

## API Endpoints

### Authentication

POST /users → Register
POST /login → Login and receive JWT

### Bills (Protected Routes)

GET /bills → Get logged-in user bills
POST /bills → Create bill
PUT /bills/:id → Update bill
DELETE /bills/:id → Delete bill

### System

GET /health → Deployment health check

---

## Architecture

React Frontend
→ Express REST API
→ MySQL Database (Railway)
→ Background Cron Scheduler
→ Twilio WhatsApp Delivery

---

## Database Schema

### users

id | name | email | phone | password_hash | created_at

### bills

id | title | amount | due_day | reminder_time | phone | message | last_notified_month | user_id | created_at

Foreign Key
bills.user_id → users.id (ON DELETE CASCADE)

Each bill belongs to one user — ensures multi-user isolation.

---

## Environment Variables (.env)

PORT=10000

DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=
DB_PORT=

JWT_SECRET=

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=

---

## Run Locally

npm install
node server.js

Server runs at
http://localhost:10000

---

## Tech Stack

Node.js
Express.js
MySQL (Railway Cloud DB)
JWT Authentication
node-cron Scheduler
Twilio WhatsApp API
Render Hosting

---

## Why Server-Side Scheduling

Frontend timers stop when browser closes.
Server scheduler runs continuously, ensuring reliable reminders.

The system behaves like an automated service rather than a webpage feature.

---

## Design Decisions

Rule-based recurrence instead of storing dates
→ Infinite monthly automation from one row

JWT authentication instead of sessions
→ Stateless scalable architecture

Foreign-key ownership model
→ Users cannot access other users’ data

---

## Future Scope

• Email notifications
• Weekly or yearly recurrence
• Payment status tracking
• Queue-based job processing
• Multiple notification channels

---

## Author

Vamshi K
Educational full-stack automation project
