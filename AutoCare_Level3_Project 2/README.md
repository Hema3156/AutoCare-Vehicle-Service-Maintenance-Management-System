# AutoCare – Vehicle Service & Maintenance Management System
DBMS Experiential Learning – Level 3 project · Team 4 · Section D · PES University
Team: Heemadhawala R (PES2UG24CS190), Hemavathi E (PES2UG24CS193)

Next.js (App Router, API route handlers) + **MySQL** (relational core) + **MongoDB** (flexible documents).

## Prerequisites
Node.js 18+, MySQL 8.0+, MongoDB 6+ (optional – the app runs without it; checklist/feedback/analytics show a notice).

## Setup
```bash
npm install
cp .env.example .env.local        # fill in values; never commit .env.local
#   openssl rand -hex 32  -> JWT_SECRET
# one-time, as a MySQL admin: create the least-privilege app user
mysql -u root -p < sql/00_app_user.sql      # change the password inside first!
npm run db:setup -- --reset       # runs sql/01..05 (needs MYSQL_ADMIN_USER/PASSWORD in .env.local)
npm run db:seed-mongo             # optional: MongoDB indexes + sample documents
npm run dev                       # http://localhost:3000
```
Demo logins (all use password `Password@123`): `admin@autocare.in` (Admin), `ravi@autocare.in` (Staff), `priya@example.com` (Customer).

## Tests
```bash
npm run build && npm start        # terminal 1
npm test                          # terminal 2 – 54 integration tests, writes a results table
```
## Repository layout
`sql/` DDL, ALTER/indexes, views, routines+triggers, seed data, demo queries · `app/` pages + `app/api` route handlers · `lib/` db, auth, guards, queries · `scripts/` setup, Mongo seed, tests · `docs/` documentation.

## Git
```bash
git init && git add . && git commit -m "AutoCare Level 3"
git remote add origin <your repo url> && git push -u origin main
```
Each member should commit their own parts so the history shows individual contributions.
