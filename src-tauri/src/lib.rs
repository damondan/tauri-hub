use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::process::Command;
use tauri::{State, Manager};
use std::sync::Mutex;
use std::fs;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TauriApp {
    pub id: String,
    pub name: String,
    pub description: String,
    pub path: PathBuf,
    pub executable: String,
    pub icon: Option<String>,
    pub status: AppStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AppStatus {
    Running,
    Stopped,
    Error,
}

type AppRegistry = Mutex<HashMap<String, TauriApp>>;

fn get_registry_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let app_dir = app_handle.path().app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    fs::create_dir_all(&app_dir)
        .map_err(|e| format!("Failed to create app data dir: {}", e))?;
    Ok(app_dir.join("registry.json"))
}

fn load_registry(app_handle: &tauri::AppHandle) -> Result<HashMap<String, TauriApp>, String> {
    let registry_path = get_registry_path(app_handle)?;
    
    if !registry_path.exists() {
        return Ok(HashMap::new());
    }
    
    let content = fs::read_to_string(&registry_path)
        .map_err(|e| format!("Failed to read registry: {}", e))?;
    
    serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse registry: {}", e))
}

fn save_registry(app_handle: &tauri::AppHandle, apps: &HashMap<String, TauriApp>) -> Result<(), String> {
    let registry_path = get_registry_path(app_handle)?;
    
    let content = serde_json::to_string_pretty(apps)
        .map_err(|e| format!("Failed to serialize registry: {}", e))?;
    
    fs::write(&registry_path, content)
        .map_err(|e| format!("Failed to write registry: {}", e))
}

#[tauri::command]
async fn get_registered_apps(registry: State<'_, AppRegistry>) -> Result<Vec<TauriApp>, String> {
    let apps = registry.lock().map_err(|e| e.to_string())?;
    Ok(apps.values().cloned().collect())
}

#[tauri::command]
async fn register_app(
    app: TauriApp,
    registry: State<'_, AppRegistry>,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let mut apps = registry.lock().map_err(|e| e.to_string())?;
    apps.insert(app.id.clone(), app);
    save_registry(&app_handle, &apps)?;
    Ok(())
}

#[tauri::command]
async fn launch_app(
    app_id: String,
    registry: State<'_, AppRegistry>,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let mut apps = registry.lock().map_err(|e| e.to_string())?;
    
    if let Some(app) = apps.get_mut(&app_id) {
        // Launch the Tauri app
        let result = Command::new(&app.executable)
            .current_dir(&app.path)
            .spawn();
            
        match result {
            Ok(_) => {
                app.status = AppStatus::Running;
                save_registry(&app_handle, &apps)?;
                Ok(())
            }
            Err(e) => {
                app.status = AppStatus::Error;
                save_registry(&app_handle, &apps)?;
                Err(format!("Failed to launch app: {}", e))
            }
        }
    } else {
        Err(format!("App with id '{}' not found", app_id))
    }
}

#[tauri::command]
async fn stop_app(
    app_id: String,
    registry: State<'_, AppRegistry>,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let mut apps = registry.lock().map_err(|e| e.to_string())?;
    
    if let Some(app) = apps.get_mut(&app_id) {
        app.status = AppStatus::Stopped;
        save_registry(&app_handle, &apps)?;
        // Note: In a real implementation, you'd track process IDs to properly terminate apps
        Ok(())
    } else {
        Err(format!("App with id '{}' not found", app_id))
    }
}

#[tauri::command]
async fn remove_app(
    app_id: String,
    registry: State<'_, AppRegistry>,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let mut apps = registry.lock().map_err(|e| e.to_string())?;
    
    if apps.remove(&app_id).is_some() {
        save_registry(&app_handle, &apps)?;
        Ok(())
    } else {
        Err(format!("App with id '{}' not found", app_id))
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            get_registered_apps,
            register_app,
            launch_app,
            stop_app,
            remove_app
        ])
        .setup(|app| {
            // Load registry from disk
            let registry_data = load_registry(&app.handle())
                .unwrap_or_else(|e| {
                    eprintln!("Failed to load registry: {}", e);
                    HashMap::new()
                });
            
            let app_registry: AppRegistry = Mutex::new(registry_data);
            app.manage(app_registry);
            
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
