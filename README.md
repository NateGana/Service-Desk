# ServiceDesk

**Customer Service & Repair Management System**

ServiceDesk is a front-end web application for a small repair or service business — a computer shop, phone repair store, electronics or appliance service center — to manage customers, service requests, repair jobs, and technicians, entirely from the browser.

---

## Description

ServiceDesk mirrors how a small repair shop actually operates: a customer drops off a device, a request is logged, a technician is assigned, the job moves through a repair pipeline, and eventually the customer pays and picks it up. The app tracks all of that — requests, technician workload, repair status, and revenue — with a dashboard that updates in real time as records change.

## Features

- **Dashboard** — total requests, pending requests, active repairs, completed repairs, total customers, and total revenue, recalculated live.
- **Service request management** — create, edit, delete, and view detailed requests with device info, problem description, technician assignment, priority, and cost tracking.
- **Repair status pipeline** — Received → Diagnosing → In Repair → Waiting for Parts → Ready for Pickup → Completed (or Cancelled), changeable inline from the request table.
- **Visual repair timeline** — a step-by-step timeline in the request details view that highlights the job's current stage.
- **Search, filter & sort** — search requests by device, customer, or request ID; filter by status, priority, or technician; sort by date.
- **Customer management** — add, edit, delete, and search customers; view a customer's full service history.
- **Technician management** — add, edit, delete technicians; each technician's active and completed job counts update automatically as requests are assigned or completed.
- **Payments & revenue** — a dedicated view showing completed-service revenue, pending payments, and paid/unpaid job counts, with a simple payment-recording flow (cash, card, GCash, bank transfer).
- **Modal-based forms** with required-field validation and inline error messages.
- **Toast notifications** confirming every add, edit, and delete action.
- **Empty states** for requests, customers, and payments when no records match the current filters.
- **Responsive layout** that adapts down to mobile, with a collapsible sidebar.

## Technologies

- HTML5
- CSS3 (custom properties, CSS Grid & Flexbox — no framework)
- Vanilla JavaScript (ES6+, no build step)
- Browser `localStorage` for persistence
- Google Fonts (IBM Plex Sans, IBM Plex Mono)
- Inline SVG icons

**This is a front-end-only project.** There is no backend, server, or database, and no real payment processing takes place. All data is created on first load as sample data and stored in your browser's `localStorage`. Clearing your browser storage will reset the app back to its sample data.

## How to Run

1. Download or clone this repository.
2. Open `index.html` directly in any modern browser (Chrome, Firefox, Edge, Safari).
3. That's it — no build step, no server, no dependencies to install.

> Tip: because data is stored in `localStorage`, it is specific to the browser and device you open the app in.

## Project Structure

```
servicedesk/
├── index.html      # App shell, views, and modal markup
├── style.css         # Design tokens, layout, and component styles
├── script.js          # Application logic (state, rendering, CRUD, storage)
└── README.md
```

## Main Functionality

| Area | What it does |
|---|---|
| Dashboard | Aggregates live statistics from requests, customers, and technicians |
| Service Requests | Full CRUD, search, status/priority/technician filters, inline status changes, date sort |
| Customers | Full CRUD, search, per-customer service history |
| Technicians | Full CRUD, search, live active/completed job counts |
| Payments | Revenue summary, per-job payment status, and payment recording |

On first launch, ServiceDesk seeds itself with realistic sample data: ten customers, four technicians with different specializations, and fourteen service requests spanning completed, active, and cancelled jobs — so the app is immediately explorable rather than empty.

## Screenshots

_Add screenshots of the Dashboard, Service Requests table, Technicians grid, and Payments view here before publishing._

```
docs/
├── dashboard.png
├── requests.png
├── technicians.png
└── payments.png
```

## Future Improvements

- Export service requests and payment records to CSV
- SMS/email notification simulation for status changes
- Barcode or QR-code job ticket generation
- Multi-branch support with per-branch technicians
- Recurring maintenance contracts and reminders
- Dark mode

---

Built with HTML5, CSS3, and vanilla JavaScript. No frameworks, no backend — just open and use.
