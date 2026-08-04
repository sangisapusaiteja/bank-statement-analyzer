# StatementAnalytics

> Upload any bank statement PDF — instantly get a 20-section financial dashboard and an accountant-friendly multi-sheet Excel report. No database. No cloud uploads. Your data never leaves your machine.

---

## The Problem

Bank statements are PDFs full of raw transaction data. Most tools either:

- **Extract only transactions** into a flat CSV/Excel — no categorization, no insights
- **Require cloud uploads** — your financial data gets stored on someone else's server
- **Are bank-specific** — work only with HDFC, ICICI, or SBI, not all banks
- **Produce single-sheet exports** — accountants have to manually split data into categories

**StatementAnalytics is different.** We do not store your data. We do not upload to any cloud. We do not require accounts. Your PDF is processed entirely on your machine and discarded immediately. No data ever leaves your computer.

---

## What It Does

| Feature | Description |
|---|---|
| **PDF Upload** | Drag & drop any bank statement PDF (password-protected or not) |
| **Auto-Parsing** | Detects bank format automatically — HDFC, ICICI, SBI, and generic fallback |
| **Transaction Extraction** | Extracts date, description, amount, balance, reference number |
| **Merchant Normalization** | Maps 100+ merchant names to canonical forms (Swiggy, Amazon, Netflix, etc.) |
| **Category Detection** | 11 categories: Food, Shopping, Fuel, Bills, Entertainment, Travel, Healthcare, Salary, Transfer, Investment, ATM |
| **Person Detection** | Extracts names from UPI transactions for person-wise grouping |
| **Duplicate Detection** | Flags exact duplicate transactions across statements |
| **Recurring Detection** | Identifies recurring payments (Netflix, rent, EMI, etc.) |
| **Salary Detection** | Detects employer, monthly salary, salary dates, growth trend |
| **Subscription Detection** | Auto-identifies Netflix, Spotify, Amazon Prime, ChatGPT, etc. |
| **AI Insights** | 20+ natural-language insights about spending patterns |
| **20-Section Dashboard** | Overview, Cash Flow, Categories, Merchants, People, Salary, Recurring, Investments, ATM, Loans, Heatmap, Timeline, Search, and more |
| **Multi-Sheet Excel Export** | 30+ sheets — Summary, Income, Expenses, UPI, NEFT, IMPS, RTGS, ATM, Cash, Transfers, Investments, Bills, Food, Fuel, Shopping, Travel, Subscriptions, Bank Charges, Person Wise, Merchant Wise, Monthly Summary, Category Summary, Recurring Payments, Large Transactions, Charts Data, Vendor/Category/Monthly Reports |
| **Dark Mode** | Full dark/light theme with persistence |
| **Drill-Down** | Click any category, vendor, or person to see filtered transaction details |

---

## Privacy & Security

**We do not store your data. We do not upload to any cloud. We do not require accounts.**

- All processing happens **entirely on your machine** — the PDF never leaves your computer
- PDF files are read into memory, processed, and **immediately discarded**
- No data is sent to any external API, server, or service
- No user accounts, no cookies, no tracking, no telemetry
- The app can run **completely offline** after the initial load
- No database, no backend, no cloud storage of any kind

Your financial data stays on your machine. Period.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS 3 + shadcn/ui |
| **PDF Parsing** | pdfjs-dist (Mozilla's PDF.js) |
| **Charts** | Recharts (Pie, Bar, Line, Area, RadialBar) |
| **Excel Export** | ExcelJS (30+ sheet workbooks) |
| **Icons** | Lucide React |
| **Drag & Drop** | react-dropzone |
| **UI Primitives** | Radix UI (Tabs, Tooltip, ScrollArea, Separator) |
| **Font** | Geist (Vercel) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (Next.js App)                    │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Upload   │  │ Dashboard    │  │ Detail (Drill-Down)  │  │
│  │ Page     │  │ (20 sections)│  │ (filtered view)      │  │
│  └────┬─────┘  └──────┬───────┘  └──────────────────────┘  │
│       │               │                                     │
│  ┌────▼───────────────▼──────────────────────────────────┐  │
│  │              API Route: /api/upload                    │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐    │  │
│  │  │ PDF.js   │  │ Parsers  │  │ Enrichment       │    │  │
│  │  │ Extract  │──▶│ HDFC    │──▶│ Merchant         │    │  │
│  │  │ Text     │  │ Generic  │  │ Category         │    │  │
│  │  └──────────┘  └──────────┘  │ Person           │    │  │
│  │                              │ Duplicate        │    │  │
│  │  ┌──────────┐  ┌──────────┐  │ Recurring        │    │  │
│  │  │ Excel    │  │ Insights │  │ Insights         │    │  │
│  │  │ Export   │  │ Engine   │  └──────────────────┘    │  │
│  │  └──────────┘  └──────────┘                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  All processing is server-side (Next.js API route)          │
│  No database, no external services, no data persistence    │
└─────────────────────────────────────────────────────────────┘
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install & Run

```bash
git clone <repo-url>
cd bank-statement-analyzer
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for Production

```bash
npm run build
npm start
```

---

## Usage

1. **Open** the app in your browser
2. **Drag & drop** a bank statement PDF (or click to browse)
3. **Optional:** Enter the PDF password if encrypted
4. **Click** "Upload & Analyze"
5. **View** the 20-section dashboard
6. **Download** the multi-sheet Excel report
7. **Click** any chart, vendor, or category to drill down

---

## Supported Banks

| Bank | Status |
|---|---|
| HDFC Bank | ✅ Full support |
| Any bank (generic format) | ✅ Fallback parser |
| Password-protected PDFs | ✅ Supported |

The generic parser handles most common Indian bank statement formats. For banks with unique formats, the parser can be extended.

---

## Dashboard Sections

1. **Overview** — Credits, Debits, Balance, Savings, Cash Flow, Avg Daily Spend
2. **Monthly Summary** — Per-month income/expense/savings cards
3. **Cash Flow** — Income vs Expense bar chart
4. **Spending Categories** — Pie chart + progress bars
5. **Merchant Analysis** — Top merchants with totals
6. **Person Analysis** — Sent/received/net per person
7. **Salary Detection** — Employer, monthly salary, dates, growth
8. **Recurring Payments** — Auto-detected recurring merchants
9. **Subscription Detection** — Netflix, Spotify, Prime, etc.
10. **Large Transactions** — Top 20
11. **ATM Withdrawals** — Total, monthly, average
12. **Investments** — Groww, Zerodha, etc.
13. **Loan Tracking** — EMI detection
14. **Daily Spending Heatmap** — GitHub-style calendar
15. **Weekly Spending** — By day of week
16. **Income Sources** — Salary, interest, refund, etc.
17. **Bank Charges** — SMS, debit card, maintenance, GST, penalty
18. **Transaction Timeline** — Scrollable visual timeline
19. **Search** — Full-text search across all transactions
20. **AI Insights** — 20+ categorized financial insights

---

## Excel Report Sheets

| Sheet | Contents |
|---|---|
| Summary | Key metrics |
| Dashboard Data | Category breakdown with percentages |
| All Transactions | Every transaction with all fields |
| Income | All credit transactions |
| Expenses | All debit transactions |
| Salary | Salary-specific transactions |
| UPI | UPI transactions |
| NEFT | NEFT transactions |
| IMPS | IMPS transactions |
| RTGS | RTGS transactions |
| ATM | ATM withdrawal transactions |
| Cash | Cash-related transactions |
| Transfers | Transfer category transactions |
| Investments | Investment transactions |
| Bills | Bill payments |
| Food | Food category transactions |
| Fuel | Fuel expenses |
| Shopping | Shopping transactions |
| Travel | Travel expenses |
| Subscriptions | Detected subscriptions |
| Bank Charges | SMS, maintenance, penalty charges |
| Person Wise | Per-person grouped transactions |
| Merchant Wise | Per-merchant summary with stats |
| Monthly Summary | Income/expense/savings per month |
| Category Summary | Category totals with percentages |
| Recurring Payments | Recurring payment details |
| Large Transactions | Top 20 largest transactions |
| Charts Data | Data for charting in Excel |
| Vendor Reports | Per-vendor grouped transactions |
| Vendor Based Txns | Per-vendor transaction tables with all fields |
| Category Reports | Per-category grouped transactions |
| Monthly Reports | Per-month grouped transactions |

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── upload/route.ts    # PDF upload & analysis API
│   │   └── debug/route.ts     # Debug endpoint
│   ├── dashboard/page.tsx     # Dashboard page
│   ├── detail/page.tsx        # Drill-down detail page
│   ├── page.tsx               # Landing/upload page
│   ├── layout.tsx             # Root layout
│   └── globals.css            # Global styles + theme
├── components/
│   ├── Dashboard.tsx          # 20-section dashboard
│   ├── theme-provider.tsx     # Dark/light theme
│   └── ui/                    # shadcn UI primitives
├── lib/
│   ├── store.ts               # In-memory data store
│   ├── utils.ts                # cn() utility
│   └── server/
│       ├── hdfc.parser.ts      # HDFC bank parser
│       ├── generic.parser.ts   # Generic fallback parser
│       ├── merchant.service.ts # Merchant normalization
│       ├── category.service.ts # Category detection
│       ├── transaction.service.ts # Enrichment
│       ├── report.service.ts   # Report builder
│       ├── insights.service.ts # AI insights engine
│       ├── excel.service.ts    # Multi-sheet Excel export
│       ├── transaction.interface.ts # Types
│       └── bank-parser.interface.ts # Parser contract
```

---

## Extending

### Add a new bank parser

Create a file `src/lib/server/<bank>.parser.ts` implementing `BankParser`:

```typescript
import { BankParser } from './bank-parser.interface';
import { Transaction } from './transaction.interface';

export class MyBankParser implements BankParser {
  bankName = 'MyBank';
  canParse(text: string): boolean { /* detect bank */ }
  parse(text: string, sourceFile: string): Transaction[] { /* parse */ }
}
```

Then register it in `src/app/api/upload/route.ts`:

```typescript
const parsers: BankParser[] = [new HDFCParser(), new MyBankParser(), new GenericParser()];
```

### Add merchant rules

Edit `src/lib/server/merchant.service.ts`:

```typescript
{ patterns: [/newmerchant/i], canonical: 'New Merchant' },
```

### Add category rules

Edit `src/lib/server/category.service.ts`:

```typescript
{ patterns: [/newcategory/i], category: 'NewCategory' },
```

---

## License

MIT
