# 🧪 Axon by Cortex Labs

A powerful desktop application for tracking lead generator performance metrics including Hours Worked, Leads Booked, Appointments Sat, Gross Sales, and Sales Per Hour (Hours Per Sale).

## About Axon

Axon is built by **Cortex Labs** to help sales organizations track and optimize their lead generation performance. With a focus on data-driven insights and clean design, Axon makes it easy to monitor productivity and effectiveness across your team.

## Features

- 📊 **Dashboard View**: Current week data entry with full year timeline below
- 🎯 **Master Tracker**: View yearly totals for individual and combined performance
- 👥 **Dynamic Lead Generators**: Add and remove lead generators on the fly
- 💾 **Persistent Data**: All data is automatically saved locally
- 🧮 **Auto Calculation**: Sales Per Hour automatically calculated from Gross Sales and Hours Worked

## Installation

1. Install Node.js (if not already installed): https://nodejs.org/

2. Install dependencies:
```bash
npm install
```

## Running the App

```bash
npm start
```

## Usage

### Adding Lead Generators

1. Click the "Add Lead Generator" button in the top right
2. Enter the name of the lead generator
3. Click "Save"

### Tracking Weekly Data

1. Select the week you want to track using the Previous/Next buttons
2. Enter data for each metric:
   - Hours Worked
   - Leads Booked
   - Appointments Sat
   - Gross Sales
3. Sales Per Hour is automatically calculated

### Viewing Reports

- **Weekly View**: See current week data for all lead generators
- **Yearly View**: Browse all recorded weeks organized by month
- **Master Tracker**: View yearly totals and performance summaries

### Managing Lead Generators

- Click "Edit" to change a lead generator's name
- Click "Remove" to delete a lead generator and all their data

## Data Storage

All data is stored locally in:
- macOS: `~/Library/Application Support/axon/tracker-data.json`
- Windows: `%APPDATA%/axon/tracker-data.json`
- Linux: `~/.config/axon/tracker-data.json`

## Building for Distribution

To package the app for distribution:

```bash
npm install --save-dev electron-builder
```

Add to package.json:
```json
"build": {
  "appId": "com.cortexlabs.axon",
  "productName": "Axon",
  "mac": {
    "category": "public.app-category.productivity"
  },
  "win": {
    "target": "nsis"
  }
}
```

Then run:
```bash
npx electron-builder
```

## Support

For issues or questions, please refer to the Electron documentation: https://www.electronjs.org/docs

---

**🧪 Axon** - Built with ❤️ by Cortex Labs  
Empowering sales teams through data-driven performance tracking

