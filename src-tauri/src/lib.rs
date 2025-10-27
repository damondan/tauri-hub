use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::process::{Command, Child, Stdio};
use tauri::{State, Manager};
use std::sync::Mutex;
use std::fs;
use std::io::Write;
use regex::Regex;

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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RecordingStatus {
    Idle,
    Recording,
    Paused,
    Processing,
}

#[derive(Debug)]
pub struct RecordingState {
    pub status: RecordingStatus,
    pub process: Option<Child>,
    pub pid: Option<u32>,
    pub current_file: Option<String>,
}

type RecordingRegistry = Mutex<RecordingState>;

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
        // Expand '~' in path if present
        let mut workdir = app.path.clone();
        let workdir_str = workdir.to_string_lossy();
        if workdir_str.starts_with("~") {
            if let Ok(home) = std::env::var("HOME") {
                let rest = workdir_str.trim_start_matches('~');
                workdir = PathBuf::from(home).join(rest.trim_start_matches('/'));
            }
        }

        // Build command, supporting dev commands with pnpm/cargo
        let mut cmd = Command::new(&app.executable);
        match app.executable.as_str() {
            // Support running package.json scripts like: pnpm run tauri:dev
            "pnpm" => {
                cmd.arg("run").arg("tauri:dev");
            }
            // Support cargo tauri dev
            "cargo" => {
                cmd.arg("tauri").arg("dev");
            }
            _ => {}
        }
        let result = cmd.current_dir(&workdir).spawn();
            
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

// Speech-to-text commands

#[tauri::command]
async fn get_recording_status(recording: State<'_, RecordingRegistry>) -> Result<RecordingStatus, String> {
    let state = recording.lock().map_err(|e| e.to_string())?;
    Ok(state.status.clone())
}

#[tauri::command]
async fn start_recording(recording: State<'_, RecordingRegistry>) -> Result<(), String> {
    let mut state = recording.lock().map_err(|e| e.to_string())?;
    
    if !matches!(state.status, RecordingStatus::Idle) {
        return Err("Recording already in progress".to_string());
    }
    
    // Get home directory
    let home = std::env::var("HOME").map_err(|e| format!("Failed to get HOME: {}", e))?;
    let music_dir = format!("{}/Music/SpeechToText", home);
    
    // Create directory if it doesn't exist
    std::fs::create_dir_all(&music_dir)
        .map_err(|e| format!("Failed to create directory: {}", e))?;
    
    // Generate filename with timestamp
    let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S");
    let filename = format!("{}/recording_{}.wav", music_dir, timestamp);
    
    // Start arecord process with high quality settings
    // 48kHz, 16-bit, mono WAV format for best Whisper quality
    let child = Command::new("arecord")
        .args(["-f", "S16_LE", "-r", "48000", "-c", "1", &filename])
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|e| format!("Failed to start arecord: {}", e))?;
    
    let pid = child.id();
    
    state.status = RecordingStatus::Recording;
    state.process = Some(child);
    state.pid = Some(pid);
    state.current_file = Some(filename);
    
    Ok(())
}

#[tauri::command]
async fn pause_recording(recording: State<'_, RecordingRegistry>) -> Result<(), String> {
    let mut state = recording.lock().map_err(|e| e.to_string())?;
    
    if !matches!(state.status, RecordingStatus::Recording) {
        return Err("Not currently recording".to_string());
    }
    
    if let Some(pid) = state.pid {
        // Send SIGSTOP to pause the process
        Command::new("kill")
            .args(["-STOP", &pid.to_string()])
            .output()
            .map_err(|e| format!("Failed to pause recording: {}", e))?;
        
        state.status = RecordingStatus::Paused;
        Ok(())
    } else {
        Err("No recording process found".to_string())
    }
}

#[tauri::command]
async fn resume_recording(recording: State<'_, RecordingRegistry>) -> Result<(), String> {
    let mut state = recording.lock().map_err(|e| e.to_string())?;
    
    if !matches!(state.status, RecordingStatus::Paused) {
        return Err("Recording is not paused".to_string());
    }
    
    if let Some(pid) = state.pid {
        // Send SIGCONT to resume the process
        Command::new("kill")
            .args(["-CONT", &pid.to_string()])
            .output()
            .map_err(|e| format!("Failed to resume recording: {}", e))?;
        
        state.status = RecordingStatus::Recording;
        Ok(())
    } else {
        Err("No recording process found".to_string())
    }
}

#[tauri::command]
async fn stop_recording_and_transcribe(recording: State<'_, RecordingRegistry>) -> Result<String, String> {
    let mut state = recording.lock().map_err(|e| e.to_string())?;
    
    if matches!(state.status, RecordingStatus::Idle) {
        return Err("No recording in progress".to_string());
    }
    
    // Kill the arecord process
    if let Some(mut child) = state.process.take() {
        child.kill().map_err(|e| format!("Failed to stop recording: {}", e))?;
        child.wait().ok(); // Wait for process to fully terminate
    }
    
    let audio_file = state.current_file.clone()
        .ok_or("No recording file found")?;
    
    state.status = RecordingStatus::Processing;
    drop(state); // Release lock during long transcription
    
    // Get home directory for whisper path
    let home = std::env::var("HOME").map_err(|e| format!("Failed to get HOME: {}", e))?;
    let whisper_bin = format!("{}/.pyenv/versions/whisper-py312/bin/whisper", home);
    
    // Run Whisper transcription directly
    let output = Command::new(&whisper_bin)
        .args([&audio_file, "--model", "medium", "--device", "cuda", "--output_format", "txt", "--output_dir", "/tmp"])
        .output()
        .map_err(|e| format!("Failed to run Whisper: {}", e))?;
    
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Whisper failed: {}", stderr));
    }
    
    // Read the transcribed text file
    let txt_file = audio_file.replace(".wav", ".txt");
    let txt_path = format!("/tmp/{}", std::path::Path::new(&txt_file)
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or("Invalid filename")?);
    
    let mut text = std::fs::read_to_string(&txt_path)
        .map_err(|e| format!("Failed to read transcription: {}", e))?;
    
    // Remove timestamps like [00:00.000 --> 00:05.000]
    let timestamp_regex = Regex::new(r"\[\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}\.\d{3}\]")
        .map_err(|e| format!("Regex error: {}", e))?;
    text = timestamp_regex.replace_all(&text, "").to_string();
    
    // Remove standalone date patterns (various formats)
    let date_patterns = vec![
        r"\d{1,2}/\d{1,2}/\d{2,4}",  // MM/DD/YYYY or DD/MM/YYYY
        r"\d{4}-\d{2}-\d{2}",         // YYYY-MM-DD
        r"\d{1,2}-\d{1,2}-\d{2,4}",  // MM-DD-YYYY or DD-MM-YYYY
        r"(?i)(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}",
    ];
    
    for pattern in date_patterns {
        let regex = Regex::new(pattern).map_err(|e| format!("Regex error: {}", e))?;
        text = regex.replace_all(&text, "").to_string();
    }
    
    // Clean up extra whitespace
    text = text.trim().to_string();
    let whitespace_regex = Regex::new(r"\s+").unwrap();
    text = whitespace_regex.replace_all(&text, " ").to_string();
    
    // Copy to clipboard using xclip (X11) or wl-copy (Wayland)
    let clipboard_cmd = if std::path::Path::new("/usr/bin/xclip").exists() {
        "xclip"
    } else if std::path::Path::new("/usr/bin/wl-copy").exists() {
        "wl-copy"
    } else {
        return Err("No clipboard tool found (xclip or wl-copy required)".to_string());
    };
    
    let mut cmd = Command::new(clipboard_cmd);
    if clipboard_cmd == "xclip" {
        cmd.args(["-selection", "clipboard"]);
    }
    
    let clipboard_result = cmd
        .stdin(Stdio::piped())
        .spawn()
        .and_then(|mut child| {
            if let Some(mut stdin) = child.stdin.take() {
                stdin.write_all(text.as_bytes())?;
            }
            child.wait()
        })
        .map_err(|e| format!("Failed to copy to clipboard: {}", e))?;
    
    if !clipboard_result.success() {
        return Err("Failed to copy to clipboard".to_string());
    }
    
    // Play notification sound (using system bell)
    Command::new("paplay")
        .arg("/usr/share/sounds/freedesktop/stereo/complete.oga")
        .spawn()
        .ok(); // Don't fail if sound doesn't play
    
    // Reset state
    let mut state = recording.lock().map_err(|e| e.to_string())?;
    state.status = RecordingStatus::Idle;
    state.pid = None;
    state.current_file = None;
    
    Ok(text)
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
            remove_app,
            get_recording_status,
            start_recording,
            pause_recording,
            resume_recording,
            stop_recording_and_transcribe
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
            
            // Initialize recording state
            let recording_state = RecordingRegistry::new(RecordingState {
                status: RecordingStatus::Idle,
                process: None,
                pid: None,
                current_file: None,
            });
            app.manage(recording_state);
            
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
