# AutoCare – Vehicle Service and Maintenance Management System

## 1. Project Overview

AutoCare is a web-based Vehicle Service and Maintenance Management System designed to simplify and organize vehicle servicing operations.

The application provides a centralized platform for customers, service staff, and administrators to manage vehicle servicing activities.

Customers can register vehicles, book service appointments, track service information, view service history, and manage payments. Staff members can handle service requests and update repair details, while administrators can manage services, inventory, staff, and reports.

The project uses **MySQL** as its relational database and **MongoDB** for flexible document-based data storage.

## 2. Team Members

| Member | Name | SRN | Responsibilities |
|---|---|---|---|
| Member 1 | Hemavathi E | PES2UG24CS193 | Authentication, Vehicles, Staff and Appointments |
| Member 2 | Heemadhawala R. | PES2UG24CS190 | Services, Billing, Inventory, Feedback, Search and Reports |

## 3. Technologies Used

| Technology | Purpose |
|---|---|
| Next.js 14 | Web application framework |
| React 18 | Frontend user interface |
| Node.js | Backend runtime environment |
| MySQL | Relational database |
| MongoDB | NoSQL document database |
| mysql2 | MySQL database connectivity |
| mongodb | MongoDB database connectivity |
| bcryptjs | Password hashing |
| jose | JWT and authentication-related functionality |
| JavaScript | Application development |

## 4. Project Modules

### Member 1 – Hemavathi E

#### 4.1 Authentication and User Management
- User registration and login.
- Password hashing using bcrypt.
- JWT-based authentication.
- Role-based access control.
- Logout functionality.

#### 4.2 Vehicle Management
- Register customer vehicles.
- Maintain vehicle information.
- View and manage registered vehicles.
- Associate vehicles with their respective customers.

#### 4.3 Staff Management
- Maintain staff information.
- Manage staff-related details.
- Support staff-related service operations.

#### 4.4 Appointment Management
- Book vehicle service appointments.
- View appointment details.
- Manage appointment status.
- Handle appointment-related operations.

### Member 2 – Heemadhawala R.

#### 4.5 Service Management
- Display available vehicle services.
- Retrieve service information from the database.
- Perform service-related operations.
- Manage individual service information.

#### 4.6 Billing and Payment Management
- Maintain payment-related information.
- Record payment amounts and payment statuses.
- Associate payments with service operations.
- Manage billing-related records.

#### 4.7 Inventory and Spare Parts Management
- Maintain spare-part information.
- Store part names, quantities, and prices.
- Monitor available spare-parts inventory.
- Support inventory-related database operations.

#### 4.8 Feedback Management
- Allow customers to submit feedback.
- Store customer feedback using MongoDB.
- Support flexible document-based feedback information.

#### 4.9 Search Functionality
- Provide search functionality within the application.
- Help users find relevant information conveniently.

#### 4.10 Reports
- Retrieve relevant operational information.
- Help administrators review service-centre activities.
- Present database information in an organized format.

## 5. Database Design

AutoCare uses two databases: MySQL and MongoDB.

### 5.1 MySQL – Relational Database

MySQL is used for structured and relational application data.

It maintains information associated with:
- Users and customers
- Vehicles
- Staff
- Appointments
- Services
- Payments
- Inventory and spare parts

**MySQL features implemented:**

- **Primary Keys:** Uniquely identify records.
- **Foreign Keys:** Establish relationships between tables.
- **CHECK Constraints:** Restrict invalid data.
- **Views:** Display information through reusable queries.
- **Indexes:** Improve data retrieval performance.
- **Stored Procedures:** Execute reusable SQL operations.
- **Stored Functions:** Perform reusable database calculations or operations.
- **Triggers:** Automatically execute actions when specified database events occur.

### 5.2 MongoDB – NoSQL Database

MongoDB is used for customer feedback.

Feedback information is stored in document format. Its flexible schema makes it suitable for information that may contain different fields across submissions.

### 5.3 Why Did We Use Both MySQL and MongoDB?

MySQL is suitable for structured data that contains relationships, such as customers, vehicles, appointments, services, and payments.

MongoDB is suitable for flexible document-based information, such as customer feedback.

Using both databases allows us to demonstrate relational and NoSQL database integration in a single application.

## 6. API Routes

The following API routes were implemented as part of the project.

### Member 1 – API Routes

| API Route | Purpose |
|---|---|
| `/api/auth/login` | User login |
| `/api/auth/register` | User registration |
| `/api/auth/logout` | User logout |
| `/api/vehicles` | Vehicle management |
| `/api/staff` | Staff management |
| `/api/appointments` | Appointment management |
| `/api/appointments/[id]` | Individual appointment operations |
| `/api/appointments/[id]/complete` | Complete appointment |

### Member 2 – API Routes

| API Route | Purpose |
|---|---|
| `/api/services` | Service management |
| `/api/services/[id]` | Individual service operations |
| `/api/parts` | Spare-parts management |
| `/api/payments` | Payment management |
| `/api/feedback` | Customer feedback |
| `/api/search` | Search functionality |
| `/api/reports` | Report generation |

## 7. Project Structure

### Member 1 – Main Files

```text
app/
├── api/
│   ├── auth/
│   │   ├── login/route.js
│   │   ├── register/route.js
│   │   └── logout/route.js
│   ├── vehicles/route.js
│   ├── staff/route.js
│   └── appointments/
│       ├── route.js
│       └── [id]/
│           ├── route.js
│           └── complete/route.js
├── login/page.js
├── register/page.js
├── vehicles/page.js
├── staff/page.js
└── appointments/
    ├── page.js
    └── [id]/page.js

lib/
├── auth.js
├── guard.js
└── db.js

components/
├── Nav.jsx
├── LogoutButton.jsx
└── Badge.jsx
```

### Member 2 – Main Files

```text
app/
├── api/
│   ├── services/
│   │   ├── route.js
│   │   └── [id]/route.js
│   ├── parts/route.js
│   ├── payments/route.js
│   ├── feedback/route.js
│   ├── search/route.js
│   └── reports/route.js
├── services/page.js
├── parts/page.js
├── billing/page.js
├── feedback/page.js
├── search/page.js
├── reports/page.js
└── dashboard/page.js

components/
├── ActionButton.jsx
├── ApiForm.jsx
└── CompleteForm.jsx

lib/
├── mongo.js
├── api.js
└── queries.js

scripts/
├── seed-mongo.mjs
└── run-tests.mjs

sql/
├── 02_alter_indexes.sql
├── 04_routines_triggers.sql
└── 06_queries.sql
```

## 8. Installation and Setup

### Prerequisites

Make sure the following are installed:

- Node.js
- npm
- MySQL Server
- MongoDB

### Step 1: Clone the Repository

```bash
git clone https://github.com/Hema3156/AutoCare-Vehicle-Service-Maintenance-Management-System.git
```

### Step 2: Navigate to the Project Directory

```bash
cd "AutoCare_Level3_Project 2"
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Configure Environment Variables

Create a `.env` file in the project root using `.env.example` as a reference.

Configure the required values for:
- MySQL connection
- MongoDB connection
- Authentication and JWT

Do not upload your actual `.env` file or credentials to GitHub.

### Step 5: Start the Databases

Make sure both MySQL and MongoDB servers are running.

### Step 6: Set Up the MySQL Database

```bash
npm run db:setup
```

### Step 7: Seed MongoDB

```bash
npm run db:seed-mongo
```

### Step 8: Start the Application

```bash
npm run dev
```

Open the application in your browser:

```text
http://localhost:3000
```

## 9. Testing

To execute the project test script, run:

```bash
npm test
```

## 10. Team Contributions

### Member 1 – Hemavathi E (PES2UG24CS193)

Responsible for:
- User registration and login.
- Authentication and authorization.
- Vehicle management.
- Staff management.
- Appointment management.
- Initial database schema.
- Views and seed data.

### Member 2 – Heemadhawala R. (PES2UG24CS190)

Responsible for:
- Service management.
- Billing and payment management.
- Inventory and spare-parts management.
- Feedback management using MongoDB.
- Search functionality.
- Reports.
- Database indexes.
- Stored procedures and stored functions.
- Database triggers.
- SQL queries and MongoDB integration.

## 11. Learning Outcomes

Through this project, we gained practical experience in:

- Full-stack web application development.
- Frontend development using Next.js and React.
- Backend development using Node.js.
- Relational database design using MySQL.
- NoSQL database integration using MongoDB.
- API development and integration.
- SQL queries and database programming.
- Database constraints and indexing.
- Stored procedures, functions, and triggers.
- Git and GitHub collaboration.

## 12. Conclusion

AutoCare provides a centralized platform for managing vehicle service-centre operations.

The application simplifies vehicle registration, appointment booking, service management, billing, inventory management, and customer feedback.

By combining Next.js, Node.js, MySQL, and MongoDB, the project demonstrates how full-stack web development and multiple database technologies can work together to build a practical vehicle service management system.