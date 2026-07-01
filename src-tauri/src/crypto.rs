use crate::services::errors::{AppError, AppResult};
use base64::Engine;
use base64::engine::general_purpose::STANDARD as BASE64;
use ring::aead::{Aad, LessSafeKey, UnboundKey, AES_256_GCM};
use ring::rand::{SecureRandom, SystemRandom};
use std::path::PathBuf;

const KEY_FILE: &str = ".dental_key";
const NONCE_LEN: usize = 12;

pub struct Crypto;

impl Crypto {
    fn get_key_path(app_data: &PathBuf) -> PathBuf {
        app_data.join(KEY_FILE)
    }

    fn load_or_create_key(app_data: &PathBuf) -> AppResult<[u8; 32]> {
        let key_path = Self::get_key_path(app_data);
        if key_path.exists() {
            let data = std::fs::read(&key_path)?;
            if data.len() == 32 {
                let mut key = [0u8; 32];
                key.copy_from_slice(&data);
                return Ok(key);
            }
        }
        let rng = SystemRandom::new();
        let mut key = [0u8; 32];
        rng.fill(&mut key)
            .map_err(|e| AppError::Encryption(format!("key generation failed: {}", e)))?;
        std::fs::write(&key_path, &key)?;
        Ok(key)
    }

    pub fn encrypt(app_data: &PathBuf, plaintext: &[u8]) -> AppResult<String> {
        let key = Self::load_or_create_key(app_data)?;
        let unbound_key = UnboundKey::new(&AES_256_GCM, &key)
            .map_err(|e| AppError::Encryption(format!("key setup failed: {}", e)))?;
        let key = LessSafeKey::new(unbound_key);

        let rng = SystemRandom::new();
        let mut nonce_bytes = [0u8; NONCE_LEN];
        rng.fill(&mut nonce_bytes)
            .map_err(|e| AppError::Encryption(format!("nonce generation failed: {}", e)))?;

        let nonce = ring::aead::Nonce::assume_unique_for_key(nonce_bytes);
        let mut in_out = plaintext.to_vec();
        key.seal_in_place_append_tag(
            nonce,
            Aad::empty(),
            &mut in_out,
        )
        .map_err(|e| AppError::Encryption(format!("encryption failed: {}", e)))?;

        let mut result = nonce_bytes.to_vec();
        result.extend_from_slice(&in_out);
        Ok(BASE64.encode(&result))
    }

    pub fn decrypt(app_data: &PathBuf, ciphertext_b64: &str) -> AppResult<Vec<u8>> {
        let key = Self::load_or_create_key(app_data)?;
        let unbound_key = UnboundKey::new(&AES_256_GCM, &key)
            .map_err(|e| AppError::Encryption(format!("key setup failed: {}", e)))?;
        let key = LessSafeKey::new(unbound_key);

        let data = BASE64
            .decode(ciphertext_b64)
            .map_err(|e| AppError::Encryption(format!("base64 decode failed: {}", e)))?;

        if data.len() < NONCE_LEN {
            return Err(AppError::Encryption("ciphertext too short".into()));
        }

        let nonce_bytes = &data[..NONCE_LEN];
        let mut ciphertext = data[NONCE_LEN..].to_vec();

        let nonce = ring::aead::Nonce::assume_unique_for_key(
            nonce_bytes.try_into().map_err(|_| {
                AppError::Encryption("invalid nonce length".into())
            })?,
        );

        let plaintext = key
            .open_in_place(nonce, Aad::empty(), &mut ciphertext)
            .map_err(|e| AppError::Encryption(format!("decryption failed: {}", e)))?;

        Ok(plaintext.to_vec())
    }
}