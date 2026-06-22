# BlockStop Downloads

**Download BlockStop for your device**

---

## 📱 iPhone

**Recommended for personal security**

### Download Option 1: App Store (Recommended)
- **Status**: Coming Soon
- **Free trial**: 14 days of NEO tier
- **Open**: Apple App Store → Search "IBlock"
- **Requirements**: iOS 14.0+, iPhone 11+

### Download Option 2: Feather (Beta/Sideload)
- **File**: `IBlock-iPhone-1.0.0.ipa` (85MB)
- **Method**: Install via Feather app
- **Requirements**: iOS 14.0+
- **Steps**:
  1. Download [Feather app](https://featherfiles.app/)
  2. Download IBlock.ipa from link below
  3. Open IBlock.ipa in Feather
  4. Trust developer in Settings

**[Download IBlock.ipa](https://downloads.blockstop.io/ios/iphone/IBlock-1.0.0.ipa)**

### Download Option 3: TestFlight (Public Beta)
- **Status**: Open beta
- **Free trial**: Full features during beta
- **Method**: Join via email invite
- **[Join TestFlight Beta](https://testflight.apple.com/join/blockstop-ios)**

---

## 📱 iPad

**Professional analysis tool with Pro features**

### Download Option 1: App Store (Recommended)
- **Status**: Coming Soon
- **App Name**: "IBlock Pro"
- **Free trial**: 14 days of PRO tier
- **Requirements**: iPadOS 14.0+, iPad (5th gen+)

### Download Option 2: Feather (Beta/Sideload)
- **File**: `IBlock-iPad-1.0.0.ipa` (95MB)
- **Features**: Full desktop-class app
- **Requirements**: iPadOS 14.0+, iPad Air 2+
- **Steps**:
  1. Install [Feather](https://featherfiles.app/)
  2. Download IBlock.ipa
  3. Open with Feather
  4. Trust developer

**[Download IBlock-iPad.ipa](https://downloads.blockstop.io/ios/ipad/IBlock-iPad-1.0.0.ipa)**

### Download Option 3: TestFlight Beta
- **[Join TestFlight](https://testflight.apple.com/join/blockstop-ipad)**

---

## ⌚ Apple Watch

**Security alerts on your wrist**

### Download: App Store (Recommended)
- **Status**: Coming Soon
- **App Name**: "IBlock Watch"
- **Requires**: watchOS 7.0+, Apple Watch Series 3+, iPhone with IBlock
- **Size**: 15MB
- **[Open App Store](https://apps.apple.com/us/app/iblock-watch/...)**

### TestFlight Beta
- **[Join TestFlight](https://testflight.apple.com/join/blockstop-watch)**

**Note**: iPhone app required for data sync

---

## 📺 Apple TV

**SOC monitoring dashboard**

### Download: App Store (Recommended)
- **Status**: Coming Soon
- **Requirements**: tvOS 14.0+, Apple TV 4K (2nd gen+), WiFi
- **Size**: 120MB
- **[Open App Store](https://apps.apple.com/us/app/iblock-tv/...)**

### TestFlight Beta
- **[Join TestFlight](https://testflight.apple.com/join/blockstop-tv)**

**Note**: Requires authentication from nearby iPhone

---

## 🖥️ macOS - Terminal Edition

**Professional CLI tool for security analysts**

### Installation Option 1: Homebrew (Recommended)
```bash
# Add tap
brew tap blockstop/tap

# Install
brew install blockstop

# Verify
blockstop --version
```

### Installation Option 2: Direct Download
```bash
# Download
curl -O https://downloads.blockstop.io/macos/blockstop-1.0.0-arm64.tar.gz  # Apple Silicon
# OR
curl -O https://downloads.blockstop.io/macos/blockstop-1.0.0-x86_64.tar.gz # Intel

# Extract
tar -xzf blockstop-1.0.0-*.tar.gz

# Install
cd blockstop
./install.sh

# Verify
blockstop --version
```

### Installation Option 3: MacPorts
```bash
sudo port install blockstop
```

### Direct Downloads
- **Apple Silicon (M1/M2/M3)**: [blockstop-1.0.0-arm64.tar.gz](https://downloads.blockstop.io/macos/blockstop-1.0.0-arm64.tar.gz) (42MB)
- **Intel**: [blockstop-1.0.0-x86_64.tar.gz](https://downloads.blockstop.io/macos/blockstop-1.0.0-x86_64.tar.gz) (48MB)

### Requirements
- macOS 10.13+ (High Sierra+)
- Bash 4.0+ or Zsh 5.0+
- 512MB RAM
- 500MB storage

### First Launch
```bash
blockstop auth login
blockstop account info
blockstop email analyze < email.txt
```

**→ [Read Full macOS Guide](./docs/README_macOS.md)**

---

## 🪟 Windows - Terminal Edition

**Terminal tool (optimized for Mac workflows)**

### Installation Option 1: Direct Download
```powershell
# Download
Invoke-WebRequest -Uri "https://downloads.blockstop.io/windows/blockstop-1.0.0.zip" -OutFile "blockstop-1.0.0.zip"

# Extract
Expand-Archive -Path "blockstop-1.0.0.zip" -DestinationPath "$env:ProgramFiles\BlockStop"

# Add to PATH
[Environment]::SetEnvironmentVariable("Path", "$env:Path;$env:ProgramFiles\BlockStop", "User")

# Verify
blockstop --version
```

### Installation Option 2: Chocolatey
```powershell
choco install blockstop
```

### Direct Download
- **Windows 10/11**: [blockstop-1.0.0.zip](https://downloads.blockstop.io/windows/blockstop-1.0.0.zip) (48MB)

### Requirements
- Windows 10/11
- PowerShell 5.0+
- 512MB RAM
- 500MB storage

### First Launch
```powershell
blockstop auth login
blockstop email analyze -Path email.txt
blockstop file scan C:\path\to\file.exe
```

**Note**: Mac-optimized for cross-platform workflows using Mac keybindings

**→ [Read Full macOS Guide](./docs/README_macOS.md) (applies to Windows too)**

---

## 📥 Download Summary Table

| Platform | Size | Latest | Download Link |
|----------|------|--------|---------------|
| iPhone (.ipa) | 85MB | 1.0.0 | [Download](https://downloads.blockstop.io/ios/iphone/IBlock-1.0.0.ipa) |
| iPad (.ipa) | 95MB | 1.0.0 | [Download](https://downloads.blockstop.io/ios/ipad/IBlock-iPad-1.0.0.ipa) |
| Apple Watch | 15MB | 1.0.0 | [App Store](https://apps.apple.com/us/app/iblock-watch/) |
| Apple TV | 120MB | 1.0.0 | [App Store](https://apps.apple.com/us/app/iblock-tv/) |
| macOS (ARM64) | 42MB | 1.0.0 | [Download](https://downloads.blockstop.io/macos/blockstop-1.0.0-arm64.tar.gz) |
| macOS (Intel) | 48MB | 1.0.0 | [Download](https://downloads.blockstop.io/macos/blockstop-1.0.0-x86_64.tar.gz) |
| Windows | 48MB | 1.0.0 | [Download](https://downloads.blockstop.io/windows/blockstop-1.0.0.zip) |

---

## 🔧 Installation Help

### iPhone/iPad Installation via Feather

1. **Download Feather app**
   - Open App Store on iPhone/iPad
   - Search "Feather"
   - Download Feather Files app

2. **Download IBlock.ipa**
   - Tap download link above
   - File saves to Downloads

3. **Open in Feather**
   - Open Feather app
   - Tap "Files"
   - Find IBlock.ipa
   - Tap to install

4. **Trust Developer**
   - Go to Settings
   - General → VPN & Device Management
   - Find developer certificate
   - Tap Trust

5. **Open IBlock**
   - IBlock now installed
   - Tap to launch
   - Follow setup wizard

### macOS Installation via Homebrew

```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Add BlockStop tap
brew tap blockstop/tap

# Install BlockStop CLI
brew install blockstop

# Verify installation
blockstop --version
```

### macOS Installation via Direct Download

```bash
# Download (choose based on your Mac chip)
curl -O https://downloads.blockstop.io/macos/blockstop-1.0.0-arm64.tar.gz

# Extract
tar -xzf blockstop-1.0.0-arm64.tar.gz

# Run installer
cd blockstop
chmod +x install.sh
./install.sh

# Verify
blockstop --version
```

---

## ⚡ System Requirements

### iPhone/iPad
- iOS/iPadOS 14.0+
- iPhone 11 or newer
- iPad (5th generation or newer)
- 150MB free storage

### Apple Watch
- watchOS 7.0+
- Apple Watch Series 3 or newer
- iPhone with IBlock installed
- Bluetooth connection

### Apple TV
- tvOS 14.0+
- Apple TV 4K (2nd gen+) or Apple TV HD (4th gen+)
- 2GB storage
- WiFi or Ethernet connection

### macOS
- macOS 10.13+ (High Sierra or newer)
- Intel or Apple Silicon (M1/M2/M3)
- Bash 4.0+ or Zsh 5.0+
- 512MB RAM minimum
- 500MB storage

### Windows
- Windows 10/11
- PowerShell 5.0+
- 512MB RAM
- 500MB storage

---

## 🔑 Authentication

All platforms require authentication:
- **Passkey** (recommended) - Face ID/Touch ID
- **Google OAuth** - Sign in with Google
- **Microsoft OAuth** - Sign in with Microsoft
- **Apple OAuth** - Sign in with Apple
- **Email + Password** - Basic authentication

Choose during first launch.

---

## 💳 Payment Methods

- 💳 **Credit Card** - Visa, Mastercard, Amex
- 🏦 **Debit Card** - Major debit cards
- 📱 **Apple Pay** - iOS/macOS
- 🪶 **UPI** - India
- 📲 **BHIM** - India
- 🏦 **Net Banking** - India, others

---

## ❓ Troubleshooting

### iPhone/iPad Installation Issues

**"Cannot install IBlock"**
- Ensure iOS/iPadOS 14.0 or newer
- Check free storage (150MB+)
- Try again later if App Store is slow

**"Trust the developer first"**
- Go to Settings → General → VPN & Device Management
- Find developer certificate
- Tap "Trust"

### macOS Installation Issues

**"Command not found: blockstop"**
- Verify installation: `which blockstop`
- Add to PATH if needed: `export PATH=/usr/local/bin:$PATH`
- Restart terminal

**"Permission denied" on install**
- Run with correct permissions: `sudo ./install.sh`
- Or use Homebrew which handles permissions

### Common Issues (All Platforms)

**"Network connection failed"**
- Check internet connection
- Verify firewall allows BlockStop
- Try again after 5 minutes

**"Authentication failed"**
- Sign out: `blockstop auth logout`
- Sign back in: `blockstop auth login`
- Use different authentication method if needed

**"Upgrade required"**
- Free tier limited to 50 scans/month
- Upgrade to NEO/PRO/MAX for unlimited

---

## 📞 Support

Need help installing BlockStop?

- 📧 **Email**: support@blockstop.io
- 💬 **In-App Chat**: Open app → Settings → Support
- 📚 **Knowledge Base**: docs.blockstop.io
- 🐛 **Report Issues**: github.com/blockstop/blockstop/issues

---

## 📝 Version History

### Version 1.0.0 (Latest)
- ✅ Initial release
- ✅ Email & file scanning
- ✅ Team collaboration
- ✅ Multi-platform support
- ✅ Enterprise integrations

**[View all releases](https://github.com/blockstop/blockstop/releases)**

---

## 🎉 Ready to get started?

1. **Choose your platform** above
2. **Download** using your preferred method
3. **Install** following the platform-specific instructions
4. **Sign up** with your preferred authentication
5. **Choose your tier** (FREE, NEO, PRO, or MAX)
6. **Start analyzing** threats!

Questions? [Contact support](mailto:support@blockstop.io) 📧
