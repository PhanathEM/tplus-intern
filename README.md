# TPLUS Management System

A web dashboard for managing an organization's IT assets — employees, equipment, software licenses, and related workflows — built as a React frontend for the TPLUS backend API.

## Features

**Authentication**
- Sign In / Create Account (new accounts require admin approval)
- Self-service "Forgot Password" flow: email → 6-digit verification code → new password
- Light/dark theme toggle, English/Lao language toggle

**Dashboard**
- Overview stat cards for every module the signed-in account has access to
- Equipment status breakdown (donut chart) and in-use-by-category breakdown (progress bars), built from live data
- Notifications panel and recent activity feed

**Workforce**
- Employees — records, department/position, equipment assigned
- Departments — with employee and equipment counts

**Hardware**
- Equipments — organized by category (Laptop, Desktop, PC, Monitor, Server, Network Device, CCTV, Access Control, Accessory), each with configurable columns and custom fields
- Assign / unassign equipment to employees
- Currently Borrowed and Borrow History, with overdue tracking

**Replacement**
- Spare-parts stock (RAM, disks, CPUs, peripherals...)
- Borrow-a-part workflow
- Device Replacement and its history

**Software & Cloud**
- Software License tracking, with expiry alerts
- Server Usage records

**Operations**
- Manage equipment/part statuses, categories, and part types

**Administration**
- User accounts — permissions, password reset, email, delete
- Activity Log (org-wide) and My Activity (per-user)
- Recycle Bin for restoring deleted records

## Tech stack

- [React 19](https://react.dev/) + [Vite](https://vite.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [React Router v7](https://reactrouter.com/) for routing
- [react-i18next](https://react.i18next.com/) for English/Lao translations
- [react-icons](https://react-icons.github.io/react-icons/) (Feather icon set)
- Plain JavaScript/JSX — no TypeScript
- PDF/Excel export via `jspdf` and `write-excel-file`

## Getting started

### Prerequisites
- Node.js 18+
- A running instance of the TPLUS backend API

### Setup

```bash
# Install dependencies
npm install

# Configure the backend API URL
cp .env.example .env
# then edit .env and set VITE_API_BASE_URL to your backend's URL

# Start the dev server
npm run dev
```

The app runs at `http://localhost:5173` by default.

### Other scripts

```bash
npm run build    # Production build to dist/
npm run preview  # Preview the production build locally
npm run lint     # Run ESLint
```

## Project structure

```
src/
├── pages/
│   ├── auth/         # Sign In, Create Account, Forgot Password
│   └── dashboard/     # Main app — one folder per feature under features/
│       ├── features/  # employees, equipment, users, activity, recycle-bin, ...
│       ├── hooks/      # cross-cutting hooks (routing, notifications, search, permissions)
│       └── components/ # shared UI (tables, dialogs, dropdowns, sidebar)
├── services/          # One file per API resource — all HTTP calls live here
├── lib/               # apiClient, permissions, i18n label helpers, activity log
├── locales/           # en.json / lo.json translation files
└── hooks/             # app-level hooks (theme, language)
```

## Permissions

Access to each page is controlled per user account (Users → Permissions). Accounts without a permission for a page simply don't see it in the sidebar or on the Dashboard home.

## Internationalization

All user-facing text goes through `react-i18next`. English and Lao translation files (`src/locales/en.json`, `src/locales/lo.json`) are kept in sync key-for-key.
