use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::process::Command;
use tauri::State;
use std::sync::Mutex;

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

#[tauri::command]
async fn get_registered_apps(registry: State<'_, AppRegistry>) -> Result<Vec<TauriApp>, String> {
    let apps = registry.lock().map_err(|e| e.to_string())?;
    Ok(apps.values().cloned().collect())
}

#[tauri::command]
async fn register_app(
    app: TauriApp,
    registry: State<'_, AppRegistry>,
) -> Result<(), String> {
    let mut apps = registry.lock().map_err(|e| e.to_string())?;
    apps.insert(app.id.clone(), app);
    Ok(())
}

#[tauri::command]
async fn launch_app(
    app_id: String,
    registry: State<'_, AppRegistry>,
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
                Ok(())
            }
            Err(e) => {
                app.status = AppStatus::Error;
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
) -> Result<(), String> {
    let mut apps = registry.lock().map_err(|e| e.to_string())?;
    
    if let Some(app) = apps.get_mut(&app_id) {
        app.status = AppStatus::Stopped;
        // Note: In a real implementation, you'd track process IDs to properly terminate apps
        Ok(())
    } else {
        Err(format!("App with id '{}' not found", app_id))
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_registry: AppRegistry = Mutex::new(HashMap::new());
    
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(app_registry)
        .invoke_handler(tauri::generate_handler![
            get_registered_apps,
            register_app,
            launch_app,
            stop_app
        ])
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
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
