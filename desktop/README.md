# BlockStop Desktop Application

A comprehensive file security scanner and blocker built with Electron, React, and TypeScript.

## Features

- **Real-time File Scanning**: Fast and efficient file scanning engine
- **Threat Detection**: Advanced threat detection with multiple severity levels
- **Quarantine Management**: Safely isolate suspicious files
- **Scan Scheduling**: Automated scheduled scans
- **System Tray Integration**: Quick access from system tray
- **Modern UI**: Native-looking interface with dark mode support
- **Auto-Updates**: Built-in update mechanism

## Project Structure

```
desktop/
├── src/
│   ├── main.ts                 # Main process entry point
│   ├── preload.ts              # IPC preload script
│   ├── windows/
│   │   ├── MainWindow.tsx      # Primary application window
│   │   ├── ScannerWindow.tsx   # Scanner interface
│   │   ├── ResultsWindow.tsx   # Results display
│   │   ├── SettingsWindow.tsx  # Settings panel
│   │   ├── NotificationsWindow.tsx  # Notifications
│   │   └── UpdateWindow.tsx    # Update notification
│   ├── components/
│   │   ├── SystemTrayMenu.tsx  # System tray context menu
│   │   └── QuickActionBar.tsx  # Quick action toolbar
│   ├── ipc/
│   │   └── handlers.ts         # IPC event handlers
│   ├── utils/
│   │   └── app-config.ts       # Configuration constants
│   └── styles/
│       └── electron-theme.css  # Application styling
├── package.json
├── tsconfig.json
└── .eslintrc.json
```

## Development

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Electron development tools

### Installation

```bash
cd desktop
npm install
```

### Running in Development

```bash
npm run dev
```

This starts both the React development server and Electron application.

### Building

```bash
# Build for current platform
npm run dist

# Build for specific platform
npm run dist:win     # Windows
npm run dist:mac     # macOS
npm run dist:linux   # Linux
```

## Key Components

### Windows

1. **MainWindow**: Primary application interface with drag-drop scanning
2. **ScannerWindow**: Advanced scanning with pattern selection and options
3. **ResultsWindow**: Detailed threat results with filtering and export
4. **SettingsWindow**: Application preferences and configuration
5. **NotificationsWindow**: Real-time notification panel
6. **UpdateWindow**: Update notification and installation

### System Integration

- **IPC Handlers**: File operations, scanning, system integration
- **System Tray**: Quick access menu with common actions
- **Auto-Update**: Built-in update checking and installation
- **File Quarantine**: Safe isolation of detected threats

## Architecture Highlights

- **Secure IPC**: Context isolation with preload script
- **Native Integration**: System tray, file dialogs, clipboard access
- **Performance**: Multi-threaded scanning with progress updates
- **Modern Styling**: CSS variables with light/dark mode support
- **Accessibility**: WCAG compliant UI with keyboard navigation

## IPC Channels

### File Operations
- `file:open-dialog` - Open file selection dialog
- `file:save-dialog` - Open save dialog
- `file:read` - Read file contents
- `file:write` - Write file contents
- `file:delete` - Delete file
- `file:exists` - Check file existence
- `file:stats` - Get file statistics

### Scanning
- `scan:start` - Begin file scan
- `scan:cancel` - Cancel active scan
- `scan:quarantine` - Quarantine file
- `scan:restore-quarantine` - Restore quarantined file

### System Integration
- `system:get-info` - Get system information
- `system:open-path` - Open file location
- `system:execute-command` - Execute system command

### Settings
- `settings:save` - Save application settings
- `settings:load` - Load application settings

### Windows
- `window:open-scanner` - Open scanner window
- `window:open-results` - Open results window
- `window:open-settings` - Open settings window
- `window:open-notifications` - Open notifications window

## Configuration

Application configuration is defined in `src/utils/app-config.ts`:

```typescript
- Scanner options (threads, timeout, chunk size)
- Theme settings (color scheme, fonts)
- Storage paths (data, cache, logs)
- Security settings (sandboxing, isolation)
```

## Styling

The application uses a comprehensive CSS variable system for theming:

- Color palette (primary, danger, warning, success, info)
- Typography (font family, sizes, weights)
- Spacing scale (xs, sm, md, lg, xl, 2xl)
- Shadows and transitions
- Border radius scale

Dark mode is automatically applied based on system preferences.

## Security

- **Context Isolation**: Renderer process isolated from main process
- **Preload Script**: Controlled IPC API exposure
- **Sandbox Mode**: Renderer process runs in Electron sandbox
- **Node Integration Disabled**: No direct node access from renderer
- **Content Security Policy**: Strict CSP headers

## Performance

- Lazy-loaded windows
- Efficient file scanning with configurable chunk size
- Progress updates with debouncing
- Optimized CSS with CSS variables
- Minimal re-renders with React hooks

## License

MIT
