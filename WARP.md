# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Tauri Hub is a desktop application management center that allows registration, management, and launching of multiple Tauri applications from a centralized dashboard. It follows a microservices architecture where the hub manages independent Tauri app processes.

**Tech Stack:**
- Frontend: SvelteKit 2.x + TypeScript + Tailwind CSS 4.x
- Backend: Rust (Tauri 2.x)
- Package Manager: pnpm

## Development Commands

### Setup
```bash
pnpm install                    # Install dependencies
```

### Development
```bash
cargo tauri dev                 # Start development server (runs both Vite + Tauri)
pnpm run dev                    # Run Vite dev server only (for frontend testing)
pnpm run check                  # Type-check with svelte-check
pnpm run check:watch            # Type-check in watch mode
```

### Build
```bash
pnpm run build                  # Build frontend (SvelteKit)
cargo tauri build               # Build production Tauri app
```

## Architecture

### Frontend (SvelteKit)
- **Single-page app** with SvelteKit routing under `src/routes/`
- Main UI in `src/routes/+page.svelte` - handles app registry display, launch/stop controls, and add dialog
- Uses Tauri API (`@tauri-apps/api/core`) to invoke Rust backend commands
- Tailwind CSS with gradient backgrounds and glassmorphism effects

### Backend (Rust/Tauri)
Located in `src-tauri/src/`:
- **`lib.rs`** - Core application logic:
  - `TauriApp` struct: Represents registered apps (id, name, description, path, executable, icon, status)
  - `AppStatus` enum: Running | Stopped | Error
  - `AppRegistry`: Thread-safe HashMap wrapped in Mutex for managing apps
  - Commands: `get_registered_apps`, `register_app`, `launch_app`, `stop_app`
- **`main.rs`** - Entry point that calls `app_lib::run()`

### State Management
- Apps stored in-memory in Rust backend using `Mutex<HashMap<String, TauriApp>>`
- No persistence yet - apps are lost on restart
- Frontend fetches state via Tauri invoke commands

### Process Management
- Apps launched via `std::process::Command`
- Current limitation: Process IDs not tracked, so `stop_app` only updates status without killing processes
- Apps directory (`apps/`) can contain registered Tauri applications

## Key Integration Points

### Tauri Commands (Frontend ↔ Backend)
All commands use `invoke()` from `@tauri-apps/api/core`:
- `get_registered_apps()` → Returns `Vec<TauriApp>`
- `register_app(app: TauriApp)` → Adds app to registry
- `launch_app(appId: string)` → Spawns app process
- `stop_app(appId: string)` → Updates status (doesn't kill process yet)

### Configuration
- **`src-tauri/tauri.conf.json`**: 
  - Frontend served from `../build` (SvelteKit output)
  - Dev server: `http://localhost:5173`
  - Window: 1200x800, min 800x600
  - Shell plugin enabled for process spawning

## Development Notes

- **No linting/formatting commands configured** - if adding, update package.json
- TypeScript strict mode enabled in `tsconfig.json`
- SvelteKit uses adapter-auto (may need specific adapter for production)
- Tauri v2.x with shell plugin for launching external processes
- Frontend development: Changes hot-reload via Vite
- Backend development: Requires `cargo tauri dev` restart for Rust changes

## Common Issues

- **Process tracking**: `stop_app` doesn't actually terminate processes - needs PID tracking implementation
- **App persistence**: Registry cleared on restart - consider adding JSON/SQLite storage
- **Error handling**: Limited error messages from backend to frontend
