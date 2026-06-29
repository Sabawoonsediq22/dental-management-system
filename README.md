# Khwaja Dental Management System

A full-featured **Dental Clinic Management System** built as a cross-platform desktop application using Tauri v2, React, and Rust. Designed for the day-to-day operations of a dental clinic — patient registration, visit tracking, dental charting, billing and invoicing, payment management, reporting, and cloud backup.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite 7, Tailwind CSS 4 |
| Desktop Framework | Tauri 2 (Rust) |
| Database | SQLite via sqlx (async) |
| State Management | TanStack React Query 5 |
| i18n | react-i18next (English / Pashto) |
| Charts | Recharts |
| PDF | jsPDF + jspdf-autotable |
| Cloud Backup | Google Drive API v3 (OAuth 2.0 PKCE) |

## Features

- **Dashboard** — Real-time clinic overview with revenue, patient flow, procedure distribution charts, and recent activity
- **Patient Management** — Full CRUD with search, filter, pagination, and detailed patient profiles
- **Patient Intake** — Single-form registration creating patient + first visit + procedures + invoice in one transaction
- **Visit & Treatment Recording** — Record visits with chief complaints, clinical notes, procedures, and tooth-specific details
- **Interactive Dental Chart** — Visual FDI tooth numbering system with tooth selection per procedure
- **Billing & Invoicing** — Auto-generated invoices, payment recording (Cash/Card/Mobile/Insurance), receipt preview and print
- **Receipts** — Print-friendly layout with clinic branding, PDF export
- **Reports & Analytics** — Monthly revenue trends, visit distribution, patient/treatment/financial reports with PDF and CSV export
- **Global Search** — Ctrl+K / Cmd+K modal search across patients, invoices, receipts, visits, treatments, and payments
- **Backup & Restore** — Manual and automatic backups to local filesystem and Google Drive with configurable frequency
- **X-ray Management** — Upload and store X-ray images linked to patients and treatment records
- **Settings** — Clinic profile configuration, logo upload, language switching, theme toggle
- **Internationalization** — Full English and Pashto (Dari) support with RTL layout
- **Dark/Light Theme** — Toggle between themes, persisted preference

## Prerequisites

- [Node.js](https://nodejs.org/) (latest LTS)
- [Rust toolchain](https://rustup.rs/) (via rustup)
- [Tauri CLI v2](https://v2.tauri.app/start/cli/)

## Getting Started

```bash
# Install frontend dependencies
npm install

# Run in development mode (desktop app with hot-reload)
npm run tauri dev

# Build for production
npm run tauri build
```

The SQLite database is created automatically on first launch. Migrations run on startup.

## Project Structure

```
src/                          # React frontend
├── components/               # Reusable UI components
│   ├── billing/              # Billing & payment components
│   ├── common/               # Shared utilities
│   ├── dashboard/            # Dashboard cards & charts
│   ├── dental-chart/         # Interactive dental chart
│   ├── layouts/              # App shell (sidebar, header)
│   ├── patients/             # Patient list & profile components
│   ├── receipt/              # Receipt preview & print
│   ├── search/               # Global search modal
│   ├── settings/             # Settings panels
│   └── ui/                   # Generic UI primitives
├── hooks/                    # Custom React hooks
├── i18n/                     # Translations (en, ps)
├── lib/                      # API layer & utilities
├── pages/                    # Page-level route components
├── shared/                   # Constants & icons
└── types/                    # TypeScript type definitions

src-tauri/                    # Rust backend
├── src/
│   ├── main.rs               # App entry point
│   ├── lib.rs                # Tauri commands
│   ├── models.rs             # Data models & DTOs
│   ├── db.rs                 # Database initialization
│   ├── config.rs             # Configuration loading
│   ├── utils.rs              # Utility functions
│   └── services/             # Business logic
│       ├── patient.rs        # Patient CRUD
│       ├── visit.rs          # Visit management
│       ├── treatment.rs      # Treatment records
│       ├── procedure.rs      # Procedure catalog
│       ├── invoice.rs        # Invoicing
│       ├── payment.rs        # Payment recording
│       ├── dashboard.rs      # Dashboard statistics
│       ├── report.rs         # Reporting
│       ├── search.rs         # Global search
│       ├── settings.rs       # App settings
│       ├── xray.rs           # X-ray uploads
│       ├── backup.rs         # Local backups
│       ├── gdrive.rs         # Google Drive integration
│       └── errors.rs         # Error types
├── migrations/               # SQL migration files
└── tauri.conf.json           # Tauri configuration

public/                       # Static assets
docs/                         # Documentation
```

## Configuration

### Google Drive Backup

To use Google Drive backups, set your OAuth client ID in `src-tauri/.env`:

```
GOOGLE_OAUTH_CLIENT_ID="your-client-id.apps.googleusercontent.com"
```

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+K / Cmd+K | Global search |
| Ctrl+N / Cmd+N | New patient |
| Ctrl+B / Cmd+B | Billing |
| Ctrl+R / Cmd+R | Reports |
| Ctrl+D / Cmd+D | Dashboard |
| Ctrl+, | Settings |
| ? | Help |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server on port 1420 |
| `npm run build` | TypeScript check + production build |
| `npm run preview` | Preview production build |
| `npm run tauri dev` | Run desktop app with hot-reload |
| `npm run tauri build` | Build desktop installer |

## License

MIT
