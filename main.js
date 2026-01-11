const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');

let mainWindow;
const dataPath = path.join(app.getPath('userData'), 'tracker-data.json');

// Configure auto-updater
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    backgroundColor: '#000000',
    titleBarStyle: 'default',
    show: false
  });

  mainWindow.loadFile('index.html');
  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Create application menu
  createMenu();

  // Open DevTools in development
  // mainWindow.webContents.openDevTools();
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Export to CSV...',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            exportToCSV();
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Check for Updates...',
          click: () => {
            if (app.isPackaged) {
              autoUpdater.checkForUpdates();
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Check for Updates',
                message: 'Checking for updates...',
                detail: 'You will be notified if an update is available.'
              });
            } else {
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Development Mode',
                message: 'Auto-updates are disabled in development mode.',
                detail: 'Build the app to test auto-update functionality.'
              });
            }
          }
        },
        { type: 'separator' },
        {
          label: 'About Axon',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Axon',
              message: 'Axon',
              detail: 'Version 1.0.0\n\nLead Generator Performance Tracking\nby Cortex Labs\n\n© 2026 Cortex Labs'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

async function exportToCSV() {
  try {
    // Request data from renderer
    const data = await mainWindow.webContents.executeJavaScript('JSON.stringify(appData)');
    const appData = JSON.parse(data);

    if (!appData.leadGenerators || appData.leadGenerators.length === 0) {
      dialog.showMessageBox(mainWindow, {
        type: 'warning',
        title: 'No Data',
        message: 'No lead generators to export',
        detail: 'Please add lead generators and data before exporting.'
      });
      return;
    }

    // Show save dialog
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Export to CSV',
      defaultPath: `axon-export-${new Date().toISOString().split('T')[0]}.csv`,
      filters: [
        { name: 'CSV Files', extensions: ['csv'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (result.canceled) {
      return;
    }

    // Generate CSV content
    const csv = generateCSV(appData);

    // Write file
    fs.writeFileSync(result.filePath, csv, 'utf8');

    // Show success message
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Export Successful',
      message: 'Data exported successfully',
      detail: `File saved to: ${result.filePath}`
    });

  } catch (error) {
    console.error('Export error:', error);
    dialog.showErrorBox('Export Failed', `Failed to export data: ${error.message}`);
  }
}

function generateCSV(appData) {
  // CSV Header
  let csv = 'Generator,Week,Year,Hours Worked,Leads Booked,Appointments Sat,Gross Sales,SPH\n';

  // Get current year from the data or use current year
  const currentYear = new Date().getFullYear();

  // Iterate through all 52 weeks
  for (let week = 1; week <= 52; week++) {
    const weekKey = `${currentYear}-W${week}`;
    const weekData = appData.weeklyData[weekKey];

    // Iterate through all generators
    appData.leadGenerators.forEach(generator => {
      let hours = 0;
      let leads = 0;
      let appointments = 0;
      let sales = 0;
      let sph = '0.00';

      // Get data if it exists
      if (weekData && weekData[generator.id]) {
        const data = weekData[generator.id];
        hours = data.hoursWorked || 0;
        leads = data.leadsBooked || 0;
        appointments = data.appointmentsSat || 0;
        sales = data.grossSales || 0;
        sph = data.salesPerHour || '0.00';
      }

      // Escape generator name if it contains commas or quotes
      const escapedName = generator.name.includes(',') || generator.name.includes('"')
        ? `"${generator.name.replace(/"/g, '""')}"`
        : generator.name;

      // Add row to CSV
      csv += `${escapedName},${week},${currentYear},${hours},${leads},${appointments},${sales},${sph}\n`;
    });
  }

  return csv;
}

app.whenReady().then(() => {
  createWindow();
  
  // Check for updates after app starts (only in production)
  if (!app.isPackaged) {
    console.log('Running in development mode - skipping update check');
  } else {
    autoUpdater.checkForUpdatesAndNotify();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Auto-updater events
autoUpdater.on('update-available', (info) => {
  console.log('Update available:', info.version);
  if (mainWindow) {
    mainWindow.webContents.send('update-available', info);
  }
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Update downloaded:', info.version);
  if (mainWindow) {
    mainWindow.webContents.send('update-downloaded', info);
  }
});

autoUpdater.on('error', (err) => {
  console.error('Update error:', err);
});

// IPC Handlers for data persistence
ipcMain.handle('load-data', () => {
  try {
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
  return null;
});

ipcMain.handle('save-data', (event, data) => {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
    return { success: true };
  } catch (error) {
    console.error('Error saving data:', error);
    return { success: false, error: error.message };
  }
});

// IPC Handlers for updates
ipcMain.handle('download-update', () => {
  autoUpdater.downloadUpdate();
  return { success: true };
});

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall();
});

ipcMain.handle('check-for-updates', () => {
  if (app.isPackaged) {
    autoUpdater.checkForUpdates();
  }
  return { success: true };
});

