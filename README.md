# FindBack — Lost & Found Recovery Platform

FindBack is a bilingual Arabic/English lost-and-found platform built with FastAPI, MySQL, and vanilla JavaScript. It connects lost and found reports through a weighted matching engine, protects communication through authenticated private conversations, and gives administrators a complete operations dashboard.

> منصة ثنائية اللغة لإدارة المفقودات والموجودات، ومطابقة البلاغات، والتواصل الآمن بين أصحابها، مع لوحة تحكم متكاملة للإدارة.

## Main Features | المزايا الرئيسية

- Arabic and English interface with RTL/LTR switching and saved language preference.
- User registration and login using JWT authentication and hashed passwords.
- Lost and found report creation with category, description, color, location, date, and image.
- Weighted matching engine with a minimum 50% result threshold.
- Private contact requests between the owners of matching reports.
- Accept/reject workflow followed by secure private conversations.
- Direct support conversations between users and administration.
- Notifications for contact requests, messages, support updates, and recovery completion.
- Item-received confirmation that closes both linked reports and the conversation.
- Separate member space and administration control center.
- Admin report management, analytics, activity feed, alerts, support inbox, and notifications.
- Responsive visual interface with real report images.

## Matching Logic | آلية المطابقة

| Signal | Weight |
|---|---:|
| Category | 40% |
| Item name | 30% |
| Color | 20% |
| Location | 10% |

Results are ranked from the highest score to the lowest, and only matches scoring **50% or more** are shown.

## Technology Stack

- Backend: Python, FastAPI, Uvicorn
- Database: MySQL, SQLAlchemy, PyMySQL
- Validation: Pydantic
- Authentication: JWT, HTTP Bearer, Argon2 password hashing
- Frontend: HTML5, CSS3, Vanilla JavaScript
- API documentation: Swagger UI / OpenAPI

## Project Structure

```text
FindBack/
├── main.py
├── database.py
├── models.py
├── schemas.py
├── security.py
├── requirements.txt
├── README.md
├── SETUP_AR.md
├── database_backup/
├── frontend/
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── assets/
└── uploads/
```

## Database Tables

| Table | Purpose |
|---|---|
| `users` | User accounts, roles, and authentication data |
| `item_reports` | Lost and found reports |
| `contact_requests` | Contact requests between report owners |
| `conversations` | Match and support conversation channels |
| `messages` | Private conversation messages |
| `notifications` | User and admin notifications |

## Local Setup on Windows

### 1. Create the MySQL database

```sql
CREATE DATABASE findback_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

Update the MySQL connection settings in `database.py` to match your local username and password.

### 2. Create and activate the virtual environment

```powershell
python -m venv venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
.\venv\Scripts\Activate.ps1
```

### 3. Install dependencies

```powershell
pip install -r requirements.txt
```

### 4. Run the application

```powershell
uvicorn main:app --reload
```

The application creates its tables automatically when it starts.

### 5. Open the platform

- Website: `http://127.0.0.1:8000/frontend/`
- API documentation: `http://127.0.0.1:8000/docs`

## Restoring the Included Demo Data

The `database_backup` folder contains the exported demo records.

1. Start the application once so SQLAlchemy creates the six tables.
2. Open MySQL Workbench.
3. Choose **Server → Data Import**.
4. Select **Import from Dump Project Folder**.
5. Choose the included `database_backup` folder.
6. Set `findback_db` as the target schema and start the import.

## Creating an Admin Account

Register normally from the website, then promote the selected account in MySQL:

```sql
UPDATE users
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

Sign out and sign in again to open the administration control center.

## Core API Routes

| Method | Route | Purpose |
|---|---|---|
| POST | `/users/register` | Create an account |
| POST | `/users/login` | Sign in and receive a JWT |
| GET | `/users/me` | View the signed-in profile |
| POST | `/reports` | Create a lost/found report |
| GET | `/reports` | Browse reports |
| GET | `/users/me/reports` | View the user’s reports |
| GET | `/reports/{id}/matches` | View suggested matches |
| POST | `/contact-requests` | Request contact |
| PATCH | `/contact-requests/{id}` | Accept or reject a request |
| GET | `/conversations` | List private conversations |
| POST | `/conversations/{id}/messages` | Send a message |
| POST | `/support/conversations` | Start an admin support conversation |
| PATCH | `/conversations/{id}/complete` | Confirm recovery and close linked reports |
| GET | `/notifications` | View notifications |
| GET | `/admin/statistics` | View administration statistics |

Exact route names and request schemas are always available in Swagger UI at `/docs`.

## Demo Workflow

1. Register two user accounts.
2. Create a lost report from the first account.
3. Create a similar found report from the second account.
4. Open the suggested matches and send a contact request.
5. Accept the request from the other account.
6. Exchange messages in the private conversation.
7. Confirm item receipt to complete the recovery and close both reports.

## Security Notes

- Never publish real database passwords or JWT secret keys.
- Keep local secrets in environment variables before deploying publicly.
- Do not commit `venv`, `__pycache__`, `.env`, or private upload data to GitHub.
- Replace demo accounts and messages before using the system with real users.

## عربي — التشغيل السريع

1. أنشئ قاعدة بيانات باسم `findback_db`.
2. عدّل بيانات اتصال MySQL داخل `database.py`.
3. فعّل البيئة الافتراضية وثبّت `requirements.txt`.
4. شغّل المشروع بالأمر `uvicorn main:app --reload`.
5. افتح الموقع من `/frontend/` والتوثيق من `/docs`.
6. يمكن استعادة البيانات التجريبية من مجلد `database_backup` عبر MySQL Workbench.

---

FindBack was developed as a full-stack training project demonstrating API development, relational database design, authentication, matching logic, bilingual UI/UX, and secure communication workflows.
