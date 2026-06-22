# IBlock - BlockStop for Apple Watch

**Security at Your Wrist**

## Overview

IBlock on Apple Watch gives you real-time security alerts and quick actions directly on your wrist. Get instant notifications when threats are detected, approve team incidents, and access key security metrics without reaching for your phone.

## Features

### Real-Time Alerts
- 🚨 **Threat Notifications** - Instant alerts for detected threats
- 📧 **Email Threats** - Phishing/malware detected
- 📁 **File Threats** - Malicious file uploads
- 🛑 **Critical Incidents** - High-severity team incidents
- ⏰ **Smart Scheduling** - Quiet hours, custom schedules

### Quick Actions
- ✅ **Acknowledge** - Mark incident reviewed
- 🔒 **Quarantine** - Isolate suspicious file
- 🚫 **Block** - Add to blocklist
- 🔗 **Open on iPhone** - View full details on phone
- 📞 **Contact Support** - Quick support access

### Complication Support
- **Large Complication** (Series 6+): Show most recent threat
- **Medium Complication**: Risk score + threat count
- **Modular/Utility**: Last scan time + status
- **GMT/World Clock**: Current incidents count

### Siri Integration
- "Show my latest threats" - Get threat summary
- "How many incidents?" - Check team incidents
- "Check WiFi security" - Analyze current network
- "Alert support" - Contact help team

### Activity Integration
- Activity rings: Complete daily security reviews
- Fitness stand hour: Remember to check app
- Stand reminders: Encourages regular security checks

## System Requirements

- **watchOS 7.0+** or later
- Apple Watch Series 3 or newer
- iPhone running iOS 14+ with IBlock installed
- Bluetooth connection to iPhone

## Installation

1. **Install IBlock on iPhone** first
   - Download from App Store or Feather
   - Complete setup

2. **Auto-Install on Apple Watch**
   - Open Watch app on iPhone
   - Go to My Watch → App Store
   - Search "IBlock"
   - Tap Install

3. **Manual Installation**
   - Apple Watch app store
   - Search "IBlock"
   - Tap "Install"
   - Confirm on iPhone

## Getting Started

### First Launch

1. **Allow Notifications**
   - Grant notification permission
   - Choose notification style:
     - Silent (vibration only)
     - Sound + vibration
     - Automatic based on time

2. **Configure Complications**
   - Add watch face complication
   - Choose complication size
   - Adjust update frequency

3. **Enable Siri**
   - Set up Siri shortcuts
   - Practice voice commands
   - Test alerts

### Threat Notifications

**Instant Alerts**
- Red banner: Critical threat
- Orange banner: High threat
- Yellow banner: Medium threat
- Swipe down to expand
- Tap to open full details

**Quick Response**
1. Threat notification appears
2. Swipe down to see options:
   - ✅ Acknowledge
   - 🔒 Quarantine
   - 🚫 Block
   - 🔗 Open on iPhone
3. Tap action to execute
4. Confirmation haptic feedback

### Team Incidents

**Incident Alerts (NEO+)**
1. Receive incident assignment
2. Quick details appear
3. Approve or reject
4. Open full incident on iPhone
5. Discuss in team chat

**Status Updates**
- Watch for team activity
- See when tasks are completed
- Get notified of escalations
- Quick acknowledgment

### WiFi Security Check (NEO+)

**Quick Network Check**
1. Open IBlock app
2. Tap "WiFi Check"
3. View current network:
   - Name (SSID)
   - Security type
   - Risk level (🟢 Safe / 🟡 Caution / 🔴 Unsafe)
4. Switch networks if unsafe

## Watch Face Integration

### BlockStop Complications

**Large Complication (Series 6+)**
```
🔴 CRITICAL
1 Threat
Last scan: 2m ago
```

**Medium Complication**
```
🟡 Risk 72
5 Threats
```

**Small Complication**
```
5🚨
Last: 2m
```

### Supported Watch Faces
- Modular
- Modular Compact
- Utility
- Compact
- GMT
- World Clock
- Siri
- Shortcuts

## Siri Commands

| Command | Response |
|---------|----------|
| "Show my threats" | List of recent threats |
| "Threat count" | Number of active threats |
| "Check WiFi" | Current network security |
| "Open IBlock" | Launch app |
| "Last scan" | When last scan occurred |
| "Alert support" | Contact help team |
| "Team status" | Team incident count |

## Notification Settings

### Customize Alerts

**Alert Types**
- ✅ Email threats
- ✅ File threats
- ✅ Team incidents
- ✅ Critical alerts
- ✅ Daily summary (8am)
- ✅ Security tips

**Quiet Hours**
- Set time window (e.g., 10pm-7am)
- Mute notifications
- Critical alerts still break through
- Customizable per day

**Alert Grouping**
- Stack similar alerts
- Group by threat type
- Stack by time received
- Custom grouping

## Premium Features (Tier-Specific)

### FREE Tier
- ✅ Basic threat alerts
- ✅ Complication support
- ✅ Siri integration
- ❌ Team incidents
- ❌ Advanced actions
- **Price: Free**

### NEO+ Tiers
- ✅ Everything in FREE
- ✅ Team incident alerts
- ✅ WiFi security check
- ✅ Quick team actions
- ✅ Activity rings (security reviews)
- **Price: From ₹99/month**

### PRO/MAX Tiers
- ✅ Everything in NEO
- ✅ Advanced analytics
- ✅ Threat trending
- ✅ Priority notifications
- ✅ Custom alert rules
- **Price: From ₹299/month**

## Watch Complications Guide

### Configuring Complications

1. **Long-press watch face**
2. **Tap Edit**
3. **Tap complication area**
4. **Swipe to "IBlock"**
5. **Choose complication type**

### Complication Types

**Large (Modular Series 6+)**
- Shows threat count
- Risk score color-coded
- Last scan time
- Tap to open app

**Medium (All watches)**
- Risk score (0-100)
- Active threat count
- Color indicator
- Quick access

**Utility (All watches)**
- Threat icon
- Count badge
- Time indicator
- Minimal design

## Battery Life

IBlock on Apple Watch is optimized for battery:
- **Notification only** (recommended): Minimal drain
- **Complication with 1hr update**: ~2-3% per 8hrs
- **Constant scanning**: Not recommended
- **Typical usage**: No significant impact

## Troubleshooting

### Notifications Not Arriving
1. Check iPhone has IBlock installed
2. Verify notifications enabled in iPhone Watch app
3. Check Apple Watch notification settings
4. Ensure Bluetooth connection
5. Restart both devices if needed

### App Crashes
1. Force close app (press side button, swipe)
2. Restart Apple Watch
3. Re-install from App Store
4. Contact support if persists

### Complication Not Updating
1. Check complication refresh rate (max 1hr)
2. Ensure app is installed on watch
3. Force sync between iPhone/watch
4. Restart watch and phone

### Battery Drain
1. Disable constant refresh
2. Reduce notification frequency
3. Remove from Siri shortcuts if unused
4. Check for background processing

## Privacy & Security

- 🔒 **Local Processing** - Data stays on watch/phone
- 🔐 **Encrypted Sync** - End-to-end encrypted communication
- 🚫 **No Cloud Storage** - Notifications only (no data stored)
- 📊 **Anonymous Analytics** - Optional only
- ⌚ **Apple Security** - Uses WatchKit security framework

## Support

- 📧 Email: support@blockstop.io
- ⌚ In-app: Long-press → Feedback
- 🌐 Docs: docs.blockstop.io

## FAQ

**Q: Does IBlock drain Apple Watch battery?**
A: No significant impact. Notifications only draw minimal power.

**Q: Can I analyze threats on the watch?**
A: No, analysis is on iPhone. Watch shows alerts and quick actions.

**Q: Does watch work without iPhone?**
A: No, Apple Watch version requires iPhone with IBlock installed.

**Q: Can multiple watches sync?**
A: Not yet. Coming in future update.

**Q: What's the notification delay?**
A: Instant on iPhone, 1-2 seconds to watch via Bluetooth.

---

**Get IBlock on Your Watch**
[Download on App Store](https://blockstop.io/downloads/watch)
