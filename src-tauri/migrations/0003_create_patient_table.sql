CREATE TABLE IF NOT EXISTS app_settings (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    clinic_name TEXT,
    clinic_phone TEXT,
    clinic_address TEXT,
    support_email TEXT,
    auto_backup_enabled BOOLEAN NOT NULL DEFAULT 0,
    auto_backup_frequency TEXT NOT NULL DEFAULT 'daily',
    auto_backup_target TEXT NOT NULL DEFAULT 'local',
    last_backup_at TEXT,
    gdrive_client_id TEXT,
    gdrive_connected BOOLEAN NOT NULL DEFAULT ,
    gdrive_folder_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);