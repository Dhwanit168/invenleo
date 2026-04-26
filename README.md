# InvenLeo — Inventory Management System

A full-stack inventory management system built with React, Node.js, Express, and MongoDB. Designed for small to mid-sized businesses that need to track stock, manage sales and purchases, handle suppliers, and get forecasting insights — all from a single dashboard.

---

## What it does

- **Product & Variant Management** — Add products with multiple variants (color, size, SKU), track stock per variant, and set low-stock thresholds
- **Sales & Purchase Tracking** — Record sales and purchase orders with automatic stock updates and invoice generation (PDF)
- **Reorder Alerts** — The system watches your stock levels and suggests reorders when variants fall below threshold; admins can approve suggestions to auto-create purchase orders
- **Demand Forecasting** — Simple moving average and weighted moving average models to project next-month demand per product
- **Supplier Management** — Maintain a supplier directory and link products/variants to preferred suppliers
- **Reports & Exports** — Generate sales/purchase reports with date filters, export to Excel or PDF
- **Audit Logs** — Every significant action (create, update, delete, approve) is logged with user info and timestamp
- **Role-Based Access** — Three roles: `admin`, `manager`, and `staff`, each with appropriate access restrictions
- **User Management** — Admins can create accounts, assign roles, activate/deactivate/block users
- **Email Notifications** — Password reset emails and reorder notification emails via SMTP

---

## Tech Stack

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication (via HTTP-only cookies)
- Nodemailer (SMTP email)
- PDFKit (invoice generation)
- SheetJS / xlsx (Excel export)

**Frontend**
- React 18 + Vite
- React Router v6
- Axios (with credential support for cookies)
- React Hook Form + Zod (form validation)
- Recharts (dashboard charts)
- Tailwind CSS

---

## Project Structure

```
IMS/
├── backend/
│   ├── config/          # DB connection, mailer setup
│   ├── controllers/     # Route handlers
│   ├── middleware/       # Auth, validation
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routers
│   ├── utils/           # Async handler, audit logger, transactions
│   ├── seed.js          # Dev seed data
│   ├── server.js        # Entry point
│   └── .env.example     # Environment variable template
└── frontend/
    ├── src/
    │   ├── components/  # Shared UI components
    │   ├── context/     # Auth context
    │   ├── guards/      # ProtectedRoute, RoleGuard
    │   ├── hooks/       # useDebounce
    │   ├── pages/       # All page components
    │   └── services/    # API service files + axios instance
    └── .env.example     # Frontend env template
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local instance or MongoDB Atlas)
- An SMTP account for email (Gmail app password works fine)

---

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd IMS
```

---

### 2. Backend setup

```bash
cd backend
npm install
```

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Open `.env` and set the following:

```env
PORT=5000
NODE_ENV=development

MONGO_URI=mongodb://localhost:27017/invenleo
# or Atlas: mongodb+srv://<user>:<pass>@cluster.mongodb.net/invenleo

JWT_SECRET=your_long_random_secret_here
JWT_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:5173

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=InvenLeo <your_email@gmail.com>

RESET_TOKEN_EXPIRES_MINUTES=15
```

> **Gmail tip:** Go to your Google account → Security → App Passwords and generate one. Use that as `SMTP_PASS`.

Start the server:

```bash
npm run dev       # development (nodemon)
npm start         # production
```

---

### 3. Frontend setup

```bash
cd ../frontend
npm install
```

Copy the env file:

```bash
cp .env.example .env
```

The only variable needed in development:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the dev server:

```bash
npm run dev
```

Frontend will be available at `http://localhost:5173`.

---

### 4. Seed the database (optional)

To populate the database with sample products, suppliers, users, sales, and purchases for testing:

```bash
cd backend
npm run seed
```

This creates the following accounts:

| Role    | Email                   | Password     |
|---------|-------------------------|--------------|
| Admin   | admin@invenleo.com      | Admin@123    |
| Manager | manager@invenleo.com    | Manager@123  |
| Staff   | staff1@invenleo.com     | Staff@123    |

> ⚠️ Only run the seed script in development. It clears existing data before inserting.

---

## Environment Variables Reference

| Variable                    | Description                                             |
|-----------------------------|---------------------------------------------------------|
| `PORT`                      | Port the Express server listens on (default: 5000)      |
| `NODE_ENV`                  | `development` or `production`                           |
| `MONGO_URI`                 | MongoDB connection string                               |
| `JWT_SECRET`                | Secret key for signing JWT tokens                       |
| `JWT_EXPIRES_IN`            | Token expiry duration (e.g. `7d`, `24h`)               |
| `FRONTEND_URL`              | Frontend origin for CORS (no trailing slash)            |
| `SMTP_HOST`                 | SMTP server hostname                                    |
| `SMTP_PORT`                 | SMTP port (587 for STARTTLS, 465 for SSL)               |
| `SMTP_SECURE`               | `true` only for port 465                                |
| `SMTP_USER`                 | SMTP login username                                     |
| `SMTP_PASS`                 | SMTP password or app password                           |
| `EMAIL_FROM`                | Display name + address for outgoing emails              |
| `RESET_TOKEN_EXPIRES_MINUTES` | How long password reset links are valid (default: 15) |

---

## API Overview

All routes are prefixed with `/api`.

| Prefix          | Description                        |
|-----------------|------------------------------------|
| `/auth`         | Login, register, logout, profile   |
| `/products`     | Product CRUD + categories          |
| `/variants`     | Variant CRUD                       |
| `/sales`        | Sales recording and history        |
| `/purchases`    | Purchase orders                    |
| `/suppliers`    | Supplier management                |
| `/reorder`      | Low-stock suggestions and approvals|
| `/forecast`     | Demand forecasting data            |
| `/reports`      | Aggregated sales/purchase reports  |
| `/dashboard`    | Summary stats for dashboard        |
| `/invoices`     | PDF invoice generation             |
| `/export`       | Excel export                       |
| `/audit`        | Audit log viewer                   |

Authentication uses HTTP-only cookies. Include `withCredentials: true` in any client making requests to the API.

---

## Role Permissions

| Feature                    | Admin | Manager | Staff |
|----------------------------|:-----:|:-------:|:-----:|
| View dashboard             | ✅    | ✅      | ✅    |
| View products              | ✅    | ✅      | ✅    |
| Create/edit products       | ✅    | ✅      | ❌    |
| Delete products            | ✅    | ✅      | ❌    |
| Record sales               | ✅    | ✅      | ✅    |
| View all sales             | ✅    | ✅      | own only |
| Create purchase orders     | ✅    | ✅      | ❌    |
| Manage suppliers           | ✅    | ✅      | ❌    |
| Approve reorder suggestions| ✅    | ✅      | ❌    |
| View reports & forecasts   | ✅    | ✅      | ❌    |
| Manage users               | ✅    | ❌      | ❌    |
| View audit logs            | ✅    | ❌      | ❌    |

---

## Notes

- MongoDB transactions are used where available (replica set). On a standalone MongoDB instance, the app falls back to non-transactional writes gracefully — no configuration needed.
- The `xlsx` package used for export is version 0.18.5, which is the last free/open-source release. Later versions changed licensing.
- Invoices and reports are generated server-side using PDFKit and streamed directly to the browser.

---

## Known Limitations

- No real-time updates (no WebSockets). Stock levels and alerts refresh on page load/navigation.
- Forecasting uses simple statistical models (moving average, weighted moving average). It works reasonably well with 3+ months of data but should not be used as the sole basis for purchasing decisions.
- Email sending is synchronous during password reset — if the SMTP server is slow, the API response will be slow. A job queue would improve this in production.

---

## License

This project was built as a final academic submission. Not licensed for commercial use.
