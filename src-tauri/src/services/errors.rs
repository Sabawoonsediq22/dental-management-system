use serde::Serialize;
use thiserror::Error;
use std::io;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("io error: {0}")]
    Io(#[from] io::Error),

    #[error("not found: {0}")]
    NotFound(String),

    #[error("invalid input: {0}")]
    InvalidInput(String),

    #[error("conflict: {0}")]
    Conflict(String),

    #[error("http error: {0}")]
    Http(String),

    #[error("backup error: {0}")]
    Backup(String),

    #[error("restore error: {0}")]
    Restore(String),

    #[error("serde error: {0}")]
    Serde(#[from] serde_json::Error),

    #[error("oauth error: {0}")]
    OAuth(String),

    #[error("encryption error: {0}")]
    Encryption(String),

    #[error("integrity error: {0}")]
    Integrity(String),

    #[error("permission denied: {0}")]
    PermissionDenied(String),
}

pub type AppResult<T> = Result<T, AppError>;

#[derive(Debug, Serialize, Clone)]
pub struct ErrorResponse {
    pub code: String,
    pub message: String,
    pub details: Option<String>,
}

impl From<AppError> for ErrorResponse {
    fn from(err: AppError) -> Self {
        let code = match &err {
            AppError::Database(_) => "DATABASE_ERROR",
            AppError::Io(_) => "IO_ERROR",
            AppError::NotFound(_) => "NOT_FOUND",
            AppError::InvalidInput(_) => "INVALID_INPUT",
            AppError::Conflict(_) => "CONFLICT",
            AppError::Http(_) => "HTTP_ERROR",
            AppError::Backup(_) => "BACKUP_ERROR",
            AppError::Restore(_) => "RESTORE_ERROR",
            AppError::Serde(_) => "SERIALIZATION_ERROR",
            AppError::OAuth(_) => "OAUTH_ERROR",
            AppError::Encryption(_) => "ENCRYPTION_ERROR",
            AppError::Integrity(_) => "INTEGRITY_ERROR",
            AppError::PermissionDenied(_) => "PERMISSION_DENIED",
        };
        ErrorResponse {
            code: code.to_string(),
            message: err.to_string(),
            details: None,
        }
    }
}

impl From<AppError> for String {
    fn from(err: AppError) -> Self {
        let resp: ErrorResponse = err.into();
        serde_json::to_string(&resp).unwrap_or_else(|_| "{\"code\":\"UNKNOWN\",\"message\":\"An unknown error occurred\"}".to_string())
    }
}
