// SlowReverb Studio — Electron wrapper
// Laadt de meegeleverde index.html (werkt offline) in een eigen venster.
const { app, BrowserWindow, session, shell, Menu, systemPreferences } = require('electron');
const path = require('path');

app.setName('SlowReverb Studio');

function createWindow() {
  const win = new BrowserWindow({
    width: 1080,
    height: 900,
    minWidth: 420,
    minHeight: 600,
    backgroundColor: '#0b0618',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    title: 'SlowReverb Studio',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false, // blijf afspelen als het venster op de achtergrond staat
    },
  });
  win.loadFile(path.join(__dirname, 'app', 'index.html'));

  // Externe links in de standaardbrowser openen
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
}

app.whenReady().then(async () => {
  // Microfoon toestaan voor opnemen (macOS vraagt zelf om bevestiging)
  session.defaultSession.setPermissionRequestHandler((wc, permission, cb) => {
    cb(['media', 'microphone', 'audioCapture', 'clipboard-sanitized-write'].includes(permission));
  });
  session.defaultSession.setPermissionCheckHandler((wc, permission) =>
    ['media', 'microphone', 'audioCapture'].includes(permission));
  if (process.platform === 'darwin' && systemPreferences.askForMediaAccess) {
    try { await systemPreferences.askForMediaAccess('microphone'); } catch (e) {}
  }

  // Exports: laat een bewaar-dialoog zien
  session.defaultSession.on('will-download', (e, item) => {
    item.setSaveDialogOptions({ title: 'Exporteer audio', defaultPath: path.join(app.getPath('music'), item.getFilename()) });
  });

  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { role: 'appMenu' },
    { role: 'fileMenu' },
    { role: 'editMenu' },
    { label: 'Weergave', submenu: [{ role: 'reload' }, { role: 'togglefullscreen' }, { type: 'separator' }, { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { type: 'separator' }, { role: 'toggleDevTools' }] },
    { role: 'windowMenu' },
  ]));

  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
