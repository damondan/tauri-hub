use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::process::{Command, Child, Stdio};
use tauri::{State, Manager, AppHandle};
use std::sync::{Mutex, Arc};
use std::fs;
use std::io::Write;
use regex::Regex;
use std::time::SystemTime;
use notify::{Watcher, RecursiveMode};
use std::sync::mpsc::channel;
use std::thread;
use std::io::{BufRead, BufReader, Seek, SeekFrom};
use tauri_plugin_notification::NotificationExt;

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

#[derive(Debug)]
pub struct OssecState {
    pub alerts_log_mtime: Option<SystemTime>,
    pub notifications_enabled: bool,
    pub last_file_position: u64,
}

type OssecRegistry = Mutex<OssecState>;

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
    let media_dir = format!("{}/Media/SpeechToText", home);
    
    // Create directory if it doesn't exist
    std::fs::create_dir_all(&media_dir)
        .map_err(|e| format!("Failed to create directory: {}", e))?;
    
    // Generate filename with timestamp
    let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S");
    let filename = format!("{}/recording_{}.wav", media_dir, timestamp);
    
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
    // Model options: "small" (faster) or "medium" (better quality)
    let model = "small";  // Change to "medium" for better quality
    // let model = "medium";  // Uncomment to use medium model
    let output = Command::new(&whisper_bin)
        .args([&audio_file, "--model", model, "--device", "cuda", "--output_format", "txt", "--output_dir", "/tmp"])
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

// OSSEC commands

#[tauri::command]
async fn check_ossec_status() -> Result<bool, String> {
    // Check if OSSEC is running by looking for ossec processes
    let output = Command::new("pgrep")
        .arg("-f")
        .arg("ossec")
        .output()
        .map_err(|e| format!("Failed to check OSSEC status: {}", e))?;
    
    Ok(output.status.success() && !output.stdout.is_empty())
}

#[tauri::command]
async fn toggle_ossec(start: bool) -> Result<(), String> {
    let action = if start { "start" } else { "stop" };
    
    // Use sh -c so the path resolution happens after privilege escalation
    let command_str = format!("/var/ossec/bin/ossec-control {}", action);
    
    let output = Command::new("pkexec")
        .arg("sh")
        .arg("-c")
        .arg(&command_str)
        .output()
        .map_err(|e| format!("Failed to {} OSSEC: {}", action, e))?;
    
    if output.status.success() {
        Ok(())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("Failed to {} OSSEC: {}", action, stderr))
    }
}

#[tauri::command]
async fn open_file_in_terminal(file_path: String) -> Result<(), String> {
    // Open file in nano using the user's default terminal emulator
    // Use pkexec for files that require elevated permissions
    let needs_sudo = file_path.starts_with("/var/ossec/") || 
                      file_path.starts_with("/var/log/aide") ||
                      file_path == "/var/ossec/etc/ossec.conf";
    
    // Try common terminal emulators in order of preference
    let terminals = vec![
        ("alacritty", vec!["-e"]),
        ("kitty", vec![]),
        ("gnome-terminal", vec!["--"]),
        ("konsole", vec!["-e"]),
        ("xterm", vec!["-e"]),
    ];
    
    for (terminal, args) in terminals {
        if Command::new("which").arg(terminal).output().map(|o| o.status.success()).unwrap_or(false) {
            let mut cmd = Command::new(terminal);
            for arg in &args {
                cmd.arg(arg);
            }
            
            // Use pkexec for restricted files
            if needs_sudo {
                cmd.arg("pkexec");
            }
            cmd.arg("nano");
            cmd.arg(&file_path);
            
            cmd.spawn()
                .map_err(|e| format!("Failed to open file: {}", e))?;
            return Ok(());
        }
    }
    
    Err("No supported terminal emulator found".to_string())
}

#[tauri::command]
async fn check_alerts_log_modified(ossec_state: State<'_, OssecRegistry>) -> Result<bool, String> {
    let log_path = "/var/ossec/logs/alerts/alerts.log";
    
    let metadata = fs::metadata(log_path)
        .map_err(|e| format!("Failed to read log file metadata: {}", e))?;
    
    let current_mtime = metadata.modified()
        .map_err(|e| format!("Failed to get modification time: {}", e))?;
    
    let mut state = ossec_state.lock().map_err(|e| e.to_string())?;
    
    if let Some(last_mtime) = state.alerts_log_mtime {
        let modified = current_mtime > last_mtime;
        if !modified {
            // Update the stored time even if not modified
            state.alerts_log_mtime = Some(current_mtime);
        }
        Ok(modified)
    } else {
        // First check - initialize the time and return false (not modified)
        state.alerts_log_mtime = Some(current_mtime);
        Ok(false)
    }
}

#[tauri::command]
async fn reset_alerts_log_baseline(ossec_state: State<'_, OssecRegistry>) -> Result<(), String> {
    let log_path = "/var/ossec/logs/alerts/alerts.log";
    
    let metadata = fs::metadata(log_path)
        .map_err(|e| format!("Failed to read log file metadata: {}", e))?;
    
    let current_mtime = metadata.modified()
        .map_err(|e| format!("Failed to get modification time: {}", e))?;
    
    let mut state = ossec_state.lock().map_err(|e| e.to_string())?;
    state.alerts_log_mtime = Some(current_mtime);
    
    // Also update file position to current end
    if let Ok(file) = fs::File::open(log_path) {
        if let Ok(metadata) = file.metadata() {
            state.last_file_position = metadata.len();
        }
    }
    
    Ok(())
}

#[tauri::command]
async fn toggle_ossec_notifications(
    enabled: bool,
    ossec_state: State<'_, OssecRegistry>
) -> Result<(), String> {
    let mut state = ossec_state.lock().map_err(|e| e.to_string())?;
    state.notifications_enabled = enabled;
    Ok(())
}

#[tauri::command]
async fn get_ossec_notifications_enabled(
    ossec_state: State<'_, OssecRegistry>
) -> Result<bool, String> {
    let state = ossec_state.lock().map_err(|e| e.to_string())?;
    Ok(state.notifications_enabled)
}

fn parse_alert_level(alert_text: &str) -> Option<u8> {
    // Extract level from "Rule: 502 (level 3)"
    if let Some(level_start) = alert_text.find("(level ") {
        let rest = &alert_text[level_start + 7..];
        if let Some(level_end) = rest.find(')') {
            return rest[..level_end].parse().ok();
        }
    }
    None
}

fn check_for_new_alerts(app_handle: &AppHandle, ossec_state: &Arc<OssecRegistry>) {
    let log_path = "/var/ossec/logs/alerts/alerts.log";
    
    // Check if notifications are enabled
    let notifications_enabled = {
        let state = match ossec_state.lock() {
            Ok(s) => s,
            Err(_) => return,
        };
        state.notifications_enabled
    };
    
    if !notifications_enabled {
        return;
    }
    
    // Open file and seek to last position
    let mut file = match fs::File::open(log_path) {
        Ok(f) => f,
        Err(_) => return,
    };
    
    let last_pos = {
        let state = match ossec_state.lock() {
            Ok(s) => s,
            Err(_) => return,
        };
        state.last_file_position
    };
    
    if file.seek(SeekFrom::Start(last_pos)).is_err() {
        return;
    }
    
    let reader = BufReader::new(file);
    let mut new_alerts = Vec::new();
    let mut current_alert = String::new();
    
    for line in reader.lines() {
        if let Ok(line) = line {
            if line.starts_with("** Alert") && !current_alert.is_empty() {
                new_alerts.push(current_alert.clone());
                current_alert.clear();
            }
            current_alert.push_str(&line);
            current_alert.push('\n');
        }
    }
    
    if !current_alert.is_empty() {
        new_alerts.push(current_alert);
    }
    
    // Send notifications for new alerts
    for alert in new_alerts {
        if let Some(level) = parse_alert_level(&alert) {
            let (title, body) = if level >= 12 {
                ("🚨 Critical OSSEC Alert", format!("High severity alert detected (Level {})!", level))
            } else if level >= 8 {
                ("⚠️ OSSEC Security Alert", format!("Suspicious activity detected (Level {}).", level))
            } else if level >= 5 {
                ("📋 OSSEC Alert", format!("Alert detected (Level {}).", level))
            } else {
                continue; // Skip low-level informational alerts
            };
            
            let _ = app_handle.notification()
                .builder()
                .title(title)
                .body(body)
                .show();
        }
    }
    
    // Update file position
    if let Ok(metadata) = fs::metadata(log_path) {
        if let Ok(mut state) = ossec_state.lock() {
            state.last_file_position = metadata.len();
        }
    }
}

fn start_alert_monitor(app_handle: AppHandle, ossec_state: Arc<OssecRegistry>) {
    let log_path = "/var/ossec/logs/alerts/alerts.log";
    let log_dir = "/var/ossec/logs/alerts";
    
    // Initialize file position
    if let Ok(metadata) = fs::metadata(log_path) {
        if let Ok(mut state) = ossec_state.lock() {
            state.last_file_position = metadata.len();
        }
    }
    
    let app_handle_clone = app_handle.clone();
    let ossec_state_clone = ossec_state.clone();
    
    thread::spawn(move || {
        let (tx, rx) = channel();
        
        let mut watcher = match notify::recommended_watcher(tx) {
            Ok(w) => w,
            Err(e) => {
                eprintln!("Failed to create file watcher: {}", e);
                return;
            }
        };
        
        if let Err(e) = watcher.watch(std::path::Path::new(log_dir), RecursiveMode::NonRecursive) {
            eprintln!("Failed to watch alerts directory: {}", e);
            return;
        }
        
        loop {
            match rx.recv() {
                Ok(Ok(event)) => {
                    // Check if the alerts.log file was modified
                    if event.paths.iter().any(|p| p.ends_with("alerts.log")) {
                        check_for_new_alerts(&app_handle_clone, &ossec_state_clone);
                    }
                }
                Ok(Err(e)) => eprintln!("Watch error: {:?}", e),
                Err(e) => {
                    eprintln!("Channel error: {:?}", e);
                    break;
                }
            }
        }
    });
}

// AIDE commands

#[tauri::command]
async fn aide_check() -> Result<String, String> {
    let output = Command::new("pkexec")
        .arg("aide")
        .arg("--check")
        .output()
        .map_err(|e| format!("Failed to run AIDE check: {}", e))?;
    
    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    
    // AIDE returns non-zero exit code when changes are detected, which is not an error
    Ok(format!("{}{}", stdout, stderr))
}

#[tauri::command]
async fn aide_update() -> Result<String, String> {
    // Run aide --update and move the new database
    // Note: AIDE writes informational output to stderr even on success
    let output = Command::new("pkexec")
        .arg("sh")
        .arg("-c")
        .arg("aide --update 2>&1 && mv /var/lib/aide/aide.db.new.gz /var/lib/aide/aide.db.gz 2>&1")
        .output()
        .map_err(|e| format!("Failed to run AIDE update: {}", e))?;
    
    // AIDE returns exit code 0 on success, even when differences are found
    // Only check the exit code, not stderr content
    if output.status.success() {
        Ok("AIDE database updated successfully".to_string())
    } else {
        let output_text = String::from_utf8_lossy(&output.stdout);
        Err(format!("AIDE update failed: {}", output_text))
    }
}

// OpenSnitch commands

#[tauri::command]
async fn check_opensnitch_status() -> Result<bool, String> {
    // Check if OpenSnitch is running by checking systemd service
    let output = Command::new("systemctl")
        .arg("is-active")
        .arg("opensnitchd")
        .output()
        .map_err(|e| format!("Failed to check OpenSnitch status: {}", e))?;
    
    // systemctl is-active returns "active" and exit code 0 if running
    Ok(output.status.success())
}

#[tauri::command]
async fn toggle_opensnitch(start: bool) -> Result<(), String> {
    let action = if start { "start" } else { "stop" };
    
    let output = Command::new("pkexec")
        .arg("systemctl")
        .arg(action)
        .arg("opensnitchd")
        .output()
        .map_err(|e| format!("Failed to {} OpenSnitch: {}", action, e))?;
    
    if output.status.success() {
        Ok(())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("Failed to {} OpenSnitch: {}", action, stderr))
    }
}

// Open WebUI commands

#[tauri::command]
async fn check_openwebui_status() -> Result<bool, String> {
    // Check if Open WebUI is running by checking systemd service
    let output = Command::new("systemctl")
        .arg("is-active")
        .arg("open-webui")
        .output()
        .map_err(|e| format!("Failed to check Open WebUI status: {}", e))?;
    
    // systemctl is-active returns "active" and exit code 0 if running
    Ok(output.status.success())
}

#[tauri::command]
async fn toggle_openwebui(start: bool) -> Result<(), String> {
    let action = if start { "start" } else { "stop" };
    
    let output = Command::new("pkexec")
        .arg("systemctl")
        .arg(action)
        .arg("open-webui")
        .output()
        .map_err(|e| format!("Failed to {} Open WebUI: {}", action, e))?;
    
    if output.status.success() {
        Ok(())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("Failed to {} Open WebUI: {}", action, stderr))
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
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
            stop_recording_and_transcribe,
            check_ossec_status,
            toggle_ossec,
            open_file_in_terminal,
            check_alerts_log_modified,
            reset_alerts_log_baseline,
            toggle_ossec_notifications,
            get_ossec_notifications_enabled,
            aide_check,
            aide_update,
            check_opensnitch_status,
            toggle_opensnitch,
            check_openwebui_status,
            toggle_openwebui
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
            
            // Initialize OSSEC state
            let ossec_state = Arc::new(OssecRegistry::new(OssecState {
                alerts_log_mtime: None,
                notifications_enabled: true, // Enabled by default
                last_file_position: 0,
            }));
            app.manage(ossec_state.clone());
            
            // Start OSSEC alert monitor
            start_alert_monitor(app.handle().clone(), ossec_state.clone());
            
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
