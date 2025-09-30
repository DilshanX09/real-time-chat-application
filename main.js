const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = !app.isPackaged;

function createWindow() {
     const win = new BrowserWindow({
          title: 'Convo Chat',
          width: 1000,
          height: 700,
          minWidth: 800,
          minHeight: 600,
          icon: path.join(__dirname, 'public', 'Logo.png'),
          autoHideMenuBar: true,
          webPreferences: {
               contextIsolation: false,
               nodeIntegration: true,
          },
     });

     if (isDev) {
          win.loadURL('http://localhost:3000').catch(err => {
               console.error('Failed to load React app:', err);
          });
     } else {
          win.loadFile(path.join(__dirname, 'client', 'build', 'index.html'));
     }
}

app.setAppUserModelId('Convo Chat');
app.whenReady().then(createWindow);
