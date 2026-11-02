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

#[derive(serde::Serialize)]
struct FileEntry {
    name: String,
    path: String,
    is_dir: bool,
    children: Vec<FileEntry>,
}

fn walk_dir(dir: &std::path::Path, base: &std::path::Path) -> Vec<FileEntry> {
    let mut entries = Vec::new();
    let Ok(read_dir) = std::fs::read_dir(dir) else {
        return entries;
    };

    let mut items: Vec<_> = read_dir.filter_map(|e| e.ok()).collect();
    items.sort_by(|a, b| {
        let a_dir = a.file_type().map(|t| t.is_dir()).unwrap_or(false);
        let b_dir = b.file_type().map(|t| t.is_dir()).unwrap_or(false);
        b_dir.cmp(&a_dir).then_with(|| a.file_name().cmp(&b.file_name()))
    });

    for entry in items {
        let name = entry.file_name().to_string_lossy().to_string();
        if name == "node_modules" || name == ".git" || name == "target" || name == "dist" {
            continue;
        }
        let full_path = entry.path();
        let rel_path = full_path
            .strip_prefix(base)
            .unwrap_or(&full_path)
            .to_string_lossy()
            .replace('\\', "/");
        let is_dir = full_path.is_dir();
        let children = if is_dir {
            walk_dir(&full_path, base)
        } else {
            Vec::new()
        };
        entries.push(FileEntry {
            name,
            path: rel_path,
            is_dir,
            children,
        });
    }
    entries
}

#[tauri::command]
async fn read_file_tree(path: String) -> Result<Vec<FileEntry>, String> {
    let base = std::path::Path::new(&path);
    if !base.is_dir() {
        return Err("Path is not a directory".to_string());
    }
    Ok(walk_dir(base, base))
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
        .invoke_handler(tauri::generate_handler![analyze_dependencies, read_file_tree])
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}
