# 🧪 Axon

**Lead Generator Performance Tracking by Cortex Labs**

Axon is a sleek, dark-themed desktop application built with Electron for tracking and analyzing lead generator performance metrics. Monitor your team's productivity with real-time calculations and intuitive timeline views.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-macOS-lightgrey)

## ✨ Features

- **📊 Dashboard View** - Current week data entry with full year timeline
- **📈 Master Tracker** - Comprehensive yearly totals and performance analytics
- **👥 Dynamic Team Management** - Add, edit, and remove lead generators on the fly
- **🧮 Auto Calculations** - Sales Per Hour (Hours Per Sale) automatically computed
- **💾 Persistent Storage** - All data saved locally and automatically
- **🌙 Dark Theme** - Professional black interface with electric blue accents
- **📅 Timeline Navigation** - View all 52 weeks with visual indicators for data status
- **🔄 Auto Updates** - Automatic update notifications and installation

## 📊 Tracked Metrics

- **Hours Worked** - Total time invested
- **Leads Booked** - Number of leads secured
- **Appointments Sat** - Completed appointments
- **Gross Sales** - Total sales count (not revenue)
- **SPH (Sales Per Hour)** - Hours per sale ratio (lower is better)

## 🚀 Installation

### For Users

Download the latest `.dmg` from [Releases](https://github.com/YOUR_USERNAME/axon/releases) and install.

1. Download `Axon-1.0.0.dmg`
2. Open the DMG file
3. Drag Axon to Applications folder
4. Launch from Applications

### For Developers

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/axon.git
cd axon

# Install dependencies
npm install

# Run the app
npm start
```

## 🛠 Tech Stack

- **Framework**: Electron 28
- **UI**: HTML5, CSS3 (Custom Dark Theme)
- **Logic**: Vanilla JavaScript
- **Data Storage**: Local JSON
- **Build**: electron-builder
- **Updates**: electron-updater

## 📦 Building

```bash
# Build for macOS
npm run build:mac

# Build for current platform
npm run build

# Publish to GitHub Releases (requires GH_TOKEN)
npm run publish
```

## 🔄 Publishing Updates

```bash
# 1. Update version in package.json
# 2. Commit changes
git add .
git commit -m "v1.0.1 - Added new feature"
git tag v1.0.1
git push origin main --tags

# 3. Set GitHub token (first time only)
export GH_TOKEN="your_github_personal_access_token"

# 4. Publish (builds and uploads to GitHub releases)
npm run publish
```

## 🎨 Design Philosophy

Axon features a monochrome dark theme inspired by the "Electric Blueprint" design system - minimalist, data-first, and professional. The interface prioritizes clarity and quick data entry while maintaining a modern aesthetic.

### Color Palette
- **Background**: Pure Black (#000000)
- **Surfaces**: Dark Grey (#1a1a1a)
- **Primary Text**: White (#FFFFFF)
- **Accents**: Cool Grey (#BCC1C5)
- **Highlights**: Electric Blue (#0029BF)

## 📝 Usage

### Adding Lead Generators

1. Click "Add Lead Generator" button
2. Enter the name
3. Click "Save"

### Tracking Weekly Data

1. Navigate to desired week using Previous/Next buttons
2. Enter metrics for each generator:
   - Hours Worked
   - Leads Booked
   - Appointments Sat
   - Gross Sales
3. SPH is automatically calculated

### Viewing Reports

- **Dashboard**: See current week + full year timeline
- **Master Tracker**: View yearly totals and performance summaries

## 📂 Data Storage

All data is stored locally:
- macOS: `~/Library/Application Support/axon/tracker-data.json`
- Windows: `%APPDATA%/axon/tracker-data.json`
- Linux: `~/.config/axon/tracker-data.json`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - See LICENSE file for details

## 🏢 About Cortex Labs

Axon is built by **Cortex Labs** to empower sales organizations with data-driven insights for optimizing lead generation performance.

---

**Version**: 1.0.0  
**Status**: Active Development  
**Platform**: macOS (Windows/Linux support coming soon)

Built with ❤️ by Cortex Labs
