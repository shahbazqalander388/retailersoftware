# Apex Retail ERP & POS System (MERN Stack)

A production-ready **Retail POS, Inventory Valuation, Gross Profit (GP) Reporting, and Accounting Khata ERP System** built using **React.js (Vite + Tailwind CSS)** and **Node.js, Express.js, and MongoDB (Mongoose)** with monetary figures in **PKR (Rs.)**.

---

## 1. System Architecture & Tech Stack

```
d:\retailer software\
├── backend\
│   ├── models\
│   │   ├── Product.js          # Barcode, cost price, sale price, stock & alerts
│   │   ├── Sale.js             # Invoices, item snapshots, COGS, Net GP, payment
│   │   ├── Account.js          # Chart of Accounts (Customer, Supplier, Cash, Bank, Expense)
│   │   └── Transaction.js      # Double-entry running ledger transactions
│   ├── routes\
│   │   ├── products.js         # Inventory CRUD, categories & restock endpoints
│   │   ├── pos.js              # Atomic POS checkout workflow & invoice generator
│   │   ├── reports.js          # Sales, GP aggregation, and inventory valuation
│   │   └── accounts.js         # Accounts, voucher posting & running ledger statements
│   ├── .env                    # PORT=5000, MONGO_URI
│   ├── server.js               # Express server configuration & MongoDB connection
│   ├── seed.js                 # Database seed script with sample data
│   └── package.json
└── frontend\
    ├── src\
    │   ├── components\
    │   │   ├── Layout.jsx              # Responsive dashboard shell & navigation
    │   │   └── ThermalReceiptModal.jsx # 80mm thermal receipt with @media print CSS
    │   ├── pages\
    │   │   ├── POSScreen.jsx           # Barcode scanning, interactive cart, checkout & hotkeys
    │   │   ├── GPReports.jsx           # Date-wise & Item-wise Gross Profit & Margin %
    │   │   ├── SalesReports.jsx        # Invoice registers, payment breakdown & reprint
    │   │   ├── InventoryValuation.jsx  # Stock valuation at Cost vs. Retail & Restock
    │   │   └── AccountsLedger.jsx      # Chart of accounts, vouchers & printable statements
    │   ├── services\api.js             # Axios API client
    │   ├── utils\formatters.js         # PKR currency & date formatters
    │   ├── App.jsx                     # React Router DOM v6 routes
    │   ├── main.jsx                    # Application entry point
    │   └── index.css                   # Tailwind styles & print CSS
    ├── index.html
    ├── vite.config.js                  # Vite server & API proxy
    ├── tailwind.config.js
    └── package.json
```

---

## 2. Live Services & Ports

* **Frontend Dashboard:** [http://localhost:3000](http://localhost:3000)
* **Backend REST API:** [http://localhost:5000/api](http://localhost:5000/api)
* **Database:** `mongodb://127.0.0.1:27017/retail_erp`

---

## 3. Key Modules & Features

### A. POS Billing Screen (`/pos`)
* **Barcode Scanner Input:** Auto-focused input with instant barcode detection (`Enter` key adds item directly to cart, increments quantity if already present) and live autocomplete search.
* **Keyboard Hotkeys:**
  * `F2`: Instant focus to Barcode / Search input.
  * `F9`: Trigger Payment & 80mm Thermal Receipt Print.
  * `Esc`: Close receipt preview modal.
* **Interactive Cart:** Real-time quantity adjustments, line-item discounts, and live Gross Profit (GP) estimation per line.
* **Checkout Panel:**
  * Customer selector (Walk-in counter or registered customer; credit sales require customer).
  * Quick customer addition modal.
  * Overall bill discount input.
  * Payment modes: `Cash`, `Bank` (select bank account), `Credit` (Khata).
  * Cash received input with quick tender buttons (`Exact`, `Rs. 500`, `Rs. 1,000`, `Rs. 5,000`) and live change-to-return calculation.
* **80mm Thermal Receipt Modal:** Formatted for standard 80mm thermal receipt printers using `@media print` CSS. Includes store header, invoice metadata, itemized table, discounts, net grand total, cashier, barcode, and store policy.

### B. Gross Profit (GP) & Margin Analytics (`/reports/gp`)
* **Date Presets:** Today, Last 7 Days, This Month, All Time, or Custom Date Range.
* **Top KPI Cards:** Total Net Revenue, Total Cost of Goods Sold (COGS), Net Gross Profit (Rs.), and Overall GP Margin (%).
* **Date-Wise GP Breakdown:** Grouped by date with net sales, COGS, gross profit, invoice count, and GP Margin %.
* **Item-Wise Profit Margin Report:** Analyzes which individual products generate the highest gross profit and highest margins with a visual health bar.

### C. Sales Invoices & Audit Registers (`/reports/sales`)
* Filter invoices by Date Range and Payment Method (`Cash`, `Bank`, `Credit`).
* Summary KPI cards showing invoice count, gross subtotal, total discounts, net sales, and cash vs. credit vs. bank volume.
* Search invoices by invoice number or customer name.
* "View / Print Receipt" button to reprint an 80mm thermal receipt at any time.

### D. Inventory Valuation & Stock Balances (`/inventory`)
* **Top KPI Cards:**
  * Total Stock Value (At Cost)
  * Total Retail Value (At Sale Price)
  * Expected Stock Profit
  * Low Stock / Out of Stock Warnings Count
* Comprehensive product table with category, stock quantity, cost, retail price, total valuation at cost & retail, expected profit, margin %, and status badges (`In Stock`, `Low Stock`, `Out of Stock`).
* "+ Add New Product" modal with custom barcode and alert threshold.
* "Quick Restock / Stock Adjustment" modal to add quantity and update cost/sale prices.

### E. Chart of Accounts & Khata Ledger (`/accounts`)
* **Double-Entry Financial Position Cards:** Total Receivables, Total Payables, Cash in Hand, Bank Balances, and Recorded Expenses.
* **Tabbed Explorer:**
  * Customers (Receivables)
  * Suppliers (Payables)
  * Cash & Bank Books
  * Shop Operational Expenses
* **Post Voucher Modal:**
  * **Receipt Voucher:** Customer pays dues -> Debits Cash/Bank (+), Credits Customer (-).
  * **Payment Voucher:** Payment to supplier -> Debits Supplier (+ towards 0), Credits Cash/Bank (-).
  * **Expense Voucher:** Daily expense payment -> Debits Expense (+), Credits Cash/Bank (-).
* **Printable Account Ledger Statement:**
  * Filter by date range.
  * Opening Balance, Period Debits, Period Credits, Closing Balance.
  * Date-wise running double-entry statement table with print view.

---

## 4. Seeding & Running Manually

To reset or re-seed sample data:
```bash
cd backend
npm run seed
```

To run both servers in dev mode:
```bash
# In backend directory:
npm run dev

# In frontend directory:
npm run dev
```
