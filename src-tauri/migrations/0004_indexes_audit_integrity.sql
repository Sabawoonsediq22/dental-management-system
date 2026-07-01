-- Missing indexes for query performance
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(created_at);
CREATE INDEX IF NOT EXISTS idx_patients_gender ON patients(gender);
CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(status);
CREATE INDEX IF NOT EXISTS idx_visits_created_at ON visits(created_at);
CREATE INDEX IF NOT EXISTS idx_procedures_visit ON procedures(visit_id);
CREATE INDEX IF NOT EXISTS idx_procedures_name ON procedures(name);
CREATE INDEX IF NOT EXISTS idx_invoices_visit ON invoices(visit_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_issued_at ON invoices(issued_at);
CREATE INDEX IF NOT EXISTS idx_invoices_outstanding ON invoices(outstanding_amount);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_received_at ON payments(received_at);
CREATE INDEX IF NOT EXISTS idx_patient_allergies_patient ON patient_allergies(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_medications_patient ON patient_medications(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_conditions_patient ON medical_conditions(patient_id);
CREATE INDEX IF NOT EXISTS idx_xrays_patient ON xrays(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

-- Add payment_method column to payments if not exists
ALTER TABLE payments ADD COLUMN method TEXT NOT NULL DEFAULT 'Cash';

-- Update existing payments to have a default method
UPDATE payments SET method = 'Cash' WHERE method IS NULL OR method = '';

-- Create indexes for common search patterns
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_patients_id ON patients(id);

-- Analyze tables for query planner
ANALYZE;
