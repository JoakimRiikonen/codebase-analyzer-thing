use std::collections::HashMap;
use std::process::Command;

fn count_lines(file_path: &std::path::Path) -> usize {
    std::fs::read_to_string(file_path)
        .map(|content| content.lines().count())
        .unwrap_or(0)
}

#[tauri::command]
async fn analyze_dependencies(path: String) -> Result<serde_json::Value, String> {
    let depcruise_bin = concat!(env!("CARGO_MANIFEST_DIR"), "/../node_modules/.bin/depcruise.cmd");
    let our_node_modules = concat!(env!("CARGO_MANIFEST_DIR"), "/../node_modules");

    let output = Command::new("cmd")
        .args([
            "/C",
            depcruise_bin,
            "--output-type",
            "json",
            "--ts-pre-compilation-deps",
            "--no-config",
            "--do-not-follow",
            "node_modules",
            ".",
        ])
        .current_dir(&path)
        .env("NODE_PATH", our_node_modules)
        .output()
        .map_err(|e| format!("Failed to run dependency-cruiser: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("dependency-cruiser failed: {}", stderr));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut json: serde_json::Value =
        serde_json::from_str(&stdout).map_err(|e| format!("Failed to parse output: {}", e))?;

    let base = std::path::Path::new(&path);
    let mut line_counts: HashMap<String, usize> = HashMap::new();
    if let Some(modules) = json.get("modules").and_then(|m| m.as_array()) {
        for module in modules {
            if let Some(source) = module.get("source").and_then(|s| s.as_str()) {
                let file_path = base.join(source);
                if file_path.exists() {
                    line_counts.insert(source.to_string(), count_lines(&file_path));
                }
            }
        }
    }
    json["lineCounts"] = serde_json::to_value(line_counts)
        .map_err(|e| format!("Failed to serialize line counts: {}", e))?;

    Ok(json)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![analyze_dependencies])
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}
