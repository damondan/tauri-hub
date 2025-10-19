# 🚀 Tauri Hub

A desktop application management center built with Tauri, SvelteKit, and Tailwind CSS. Tauri Hub allows you to register, manage, and launch multiple Tauri applications from a centralized dashboard.

## Features

- 📱 **App Registry**: Register and manage multiple Tauri applications
- 🚀 **Launch Control**: Start and stop applications directly from the hub
- 💎 **Beautiful UI**: Modern gradient interface with glassmorphism effects
- 📊 **Status Monitoring**: Real-time status tracking for all registered apps
- ⚡ **Fast & Lightweight**: Built with Tauri for optimal performance

## Tech Stack

- **Frontend**: SvelteKit + TypeScript + Tailwind CSS
- **Backend**: Rust (Tauri)
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://rustup.rs/)
- [pnpm](https://pnpm.io/)

### Installation

1. Clone the repository:
   ```bash
   git clone git@github.com:damondan/tauri-hub.git
   cd tauri-hub
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Run the development server:
   ```bash
   cargo tauri dev
   ```

### Building

To create a production build:

```bash
pnpm run build
cargo tauri build
```

## Usage

1. **Adding Applications**: Click the "Add Application" button and fill in:
   - Name: Display name for your app
   - Description: Brief description of the app
   - Path: Directory path where the app is located
   - Executable: Path to the app's executable file
   - Icon: Emoji to represent the app

2. **Managing Applications**: 
   - Click on app cards to launch/stop applications
   - Use the "Refresh Apps" button to update status
   - View real-time status with color-coded indicators

## Architecture

Tauri Hub follows a microservices architecture where:
- The hub acts as a central management dashboard
- Each registered app runs as an independent process
- Apps can optionally share data through the hub's coordination layer
- Process lifecycle is managed by the hub's Rust backend

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Roadmap

- [ ] App discovery and auto-registration
- [ ] Process monitoring and health checks
- [ ] Inter-app communication system
- [ ] Configuration management
- [ ] Plugin system for extensibility
- [ ] Themes and customization options
