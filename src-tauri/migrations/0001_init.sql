-- Initial schema for dental clinic management system
CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    age INTEGER NOT NULL CHECK (age > 0 AND age <= 120),
    gender TEXT NOT NULL CHECK(gender IN ('Male','Female','Other')),
    address TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS patient_allergies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    allergy_name TEXT NOT NULL,
    UNIQUE(patient_id, allergy_name)
);

CREATE TABLE IF NOT EXISTS patient_medications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    medication_name TEXT NOT NULL,
    UNIQUE(patient_id, medication_name)
);

CREATE TABLE IF NOT EXISTS medical_conditions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    condition_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    UNIQUE(patient_id, condition_name)
);

CREATE TABLE IF NOT EXISTS visits (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    visit_date TEXT NOT NULL DEFAULT (datetime('now')),
    chief_complaint TEXT DEFAULT '',
    clinical_notes TEXT DEFAULT '',
    status TEXT DEFAULT 'Open' CHECK(status IN ('Open','Completed','Cancelled')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS procedures (
    id TEXT PRIMARY KEY,
    visit_id TEXT NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    additional_note TEXT,
    procedure_price REAL NOT NULL CHECK (procedure_price >= 0),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS treatment_records (
    id TEXT PRIMARY KEY,
    visit_id TEXT NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    procedure_id TEXT NOT NULL REFERENCES procedures(id),
    number_of_procedures INTEGER NOT NULL DEFAULT 1 CHECK(number_of_procedures > 0), -- number of times the procedure was performed
    performed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS treatment_tooth (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    treatment_record_id TEXT REFERENCES treatment_records(id) ON DELETE CASCADE,
    tooth_number INTEGER NOT NULL,
    tooth_quadrant TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    visit_id TEXT NOT NULL UNIQUE REFERENCES visits(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL UNIQUE,
    subtotal REAL NOT NULL CHECK(subtotal >= 0),
    discount REAL NOT NULL DEFAULT 0 CHECK(discount >= 0),
    total_amount REAL NOT NULL CHECK(total_amount >= 0),
    paid_amount REAL NOT NULL DEFAULT 0 CHECK(paid_amount >= 0),
    outstanding_amount REAL NOT NULL DEFAULT 0 CHECK(outstanding_amount >= 0),
    status TEXT NOT NULL CHECK(status IN ('Unpaid','Partial','Paid')),
    issued_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    amount REAL NOT NULL CHECK(amount > 0),
    notes TEXT DEFAULT '',
    received_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS xrays (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    treatment_record_id TEXT REFERENCES treatment_records(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    treatment_record_id TEXT REFERENCES treatment_records(id),
    procedure_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    total_price REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS app_settings (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    clinic_name TEXT,
    clinic_phone TEXT,
    clinic_address TEXT,
    language TEXT DEFAULT 'en',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS backups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    backup_type TEXT NOT NULL CHECK (backup_type IN ('daily', 'weekly', 'monthly', 'manual')),
    backup_path TEXT NOT NULL,
    cloud_provider TEXT NOT NULL DEFAULT 'google_drive',
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
    file_size INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT
);

CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    changed_by TEXT DEFAULT 'system',
    changed_at TEXT NOT NULL DEFAULT (datetime('now')),
    changes TEXT
);

CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_name ON patients(full_name);
CREATE INDEX idx_visits_patient ON visits(patient_id);
CREATE INDEX idx_visits_date ON visits(visit_date);
CREATE INDEX idx_backups_status ON backups(status);
CREATE INDEX idx_backups_created_at ON backups(created_at);
CREATE INDEX idx_backups_type_status ON backups(backup_type, status);
CREATE INDEX IF NOT EXISTS idx_treatment_tooth_record ON treatment_tooth(treatment_record_id);
CREATE INDEX IF NOT EXISTS idx_treatment_records_visit ON treatment_records(visit_id);
CREATE INDEX IF NOT EXISTS idx_xrays_treatment_record ON xrays(treatment_record_id);

