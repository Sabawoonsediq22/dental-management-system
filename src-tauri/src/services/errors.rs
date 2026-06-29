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
    #[allow(dead_code)]
    InvalidInput(String),

    #[error("conflict: {0}")]
    #[allow(dead_code)]
    Conflict(String),

    #[error("http error: {0}")]
    Http(String),

    #[error("backup error: {0}")]
    Backup(String),

    #[error("serde error: {0}")]
    Serde(#[from] serde_json::Error),

    #[error("oauth error: {0}")]
    OAuth(String),
}

pub type AppResult<T> = Result<T, AppError>;
