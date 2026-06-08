#[allow(dead_code)]
pub fn compute_initials(full_name: &str) -> String {
    let parts: Vec<&str> = full_name.trim().split_whitespace().collect();
    if parts.len() >= 2 {
        let first = parts[0].chars().next().unwrap_or(' ').to_uppercase().to_string();
        let last = parts.last().unwrap().chars().next().unwrap_or(' ').to_uppercase().to_string();
        first + &last
    } else {
        full_name.chars().take(2).collect::<String>().to_uppercase()
    }
}