const { app, BrowserWindow, ipcMain, screen, Menu } = require('electron');
const path = require('path');
const http = require('http');
const https = require('https');

let mainWindow;

Menu.setApplicationMenu(null);

app.userAgentFallback = app.userAgentFallback
  .replace(/Electron\/\S+\s*/g, '')
  .replace(/\s+Electron\S*/g, '');



function createWindow() {
  mainWindow = new BrowserWindow({
    width: 876,
    height: 574,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    minWidth: 187,
    minHeight: 204,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      backgroundThrottling: true,
    },
  });

  mainWindow.setPosition(300, 300);
  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  let isDragging = false;

  ipcMain.on('start-drag', () => { isDragging = true; });
  ipcMain.on('move-window', (e, { deltaX, deltaY }) => {
    if (!isDragging) return;
    const [x, y] = mainWindow.getPosition();
    mainWindow.setPosition(x + deltaX, y + deltaY);
  });
  ipcMain.on('end-drag', () => { isDragging = false; });

  ipcMain.handle('get-window-position', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return null;
    const [x, y] = mainWindow.getPosition();
    const bounds = mainWindow.getBounds();
    return { x, y, width: bounds.width, height: bounds.height, screenWidth: screen.getPrimaryDisplay().workAreaSize.width };
  });

  ipcMain.on('wander-move', (e, { deltaX, deltaY }) => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const [x, y] = mainWindow.getPosition();
    mainWindow.setPosition(x + deltaX, y + deltaY);
  });

  ipcMain.handle('set-window-pos', (e, { x, y }) => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    mainWindow.setPosition(Math.round(x), Math.round(y));
  });

  ipcMain.handle('get-screen-info', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return null;
    const displays = screen.getAllDisplays();
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const d of displays) {
      const b = d.workArea;
      minX = Math.min(minX, b.x);
      minY = Math.min(minY, b.y);
      maxX = Math.max(maxX, b.x + b.width);
      maxY = Math.max(maxY, b.y + b.height);
    }
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  });

  ipcMain.handle('resize-window', async (e, { width, height, x, y }) => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    await new Promise(resolve => {
      const onResize = () => { mainWindow.removeListener('resize', onResize); resolve(); };
      mainWindow.on('resize', onResize);
      if (x !== undefined && y !== undefined) mainWindow.setBounds({ x, y, width, height });
      else mainWindow.setSize(width, height);
      setTimeout(resolve, 200);
    });
  });

  let cursorIntervalId = null;
  function startCursorTracking() {
    if (cursorIntervalId) return;
    cursorIntervalId = setInterval(() => {
      if (!mainWindow || mainWindow.isDestroyed()) return;
      try {
        const cursor = screen.getCursorScreenPoint();
        const [winX, winY] = mainWindow.getPosition();
        mainWindow.webContents.send('cursor-move', {
          clientX: cursor.x - winX,
          clientY: cursor.y - winY,
        });
      } catch (e) {}
    }, 100);
  }
  startCursorTracking();

  mainWindow.on('minimize', () => {
    mainWindow.webContents.send('window-hidden');
    if (cursorIntervalId) { clearInterval(cursorIntervalId); cursorIntervalId = null; }
  });
  mainWindow.on('restore', () => {
    mainWindow.webContents.send('window-visible');
    startCursorTracking();
  });
  mainWindow.on('blur', () => mainWindow.webContents.send('window-hidden'));
  mainWindow.on('focus', () => mainWindow.webContents.send('window-visible'));

  mainWindow.webContents.on('before-input-event', (e, input) => {
    if (input.type === 'keyDown') {
      if (input.key === 'F12' ||
          ((input.control || input.meta) && input.shift &&
           (input.key === 'I' || input.key === 'J' || input.key === 'C'))) {
        e.preventDefault();
      }
    }
  });

  mainWindow.webContents.on('devtools-opened', () => {
    mainWindow.webContents.closeDevTools();
  });

  ipcMain.handle('show-launcher', async () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const display = screen.getPrimaryDisplay().workArea;
    const lx = Math.round((display.width - 876) / 2);
    const ly = Math.round((display.height - 574) / 2);
    await mainWindow.setBounds({ x: lx, y: ly, width: 876, height: 574 });
    mainWindow.setMinimumSize(876, 574);
    mainWindow.setResizable(true);
  });

  ipcMain.handle('show-pet', async () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const [x, y] = mainWindow.getPosition();
    await mainWindow.setBounds({ x, y, width: 187, height: 204 });
    mainWindow.setMinimumSize(187, 204);
    mainWindow.setMaximumSize(187, 204);
    mainWindow.setResizable(false);
  });

  ipcMain.on('minimize-window', () => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.minimize();
  });

  ipcMain.on('close-window', () => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.close();
  });

  ipcMain.on('set-always-on-top', (e, value) => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.setAlwaysOnTop(value);
  });

  // ── Proxy ──
  let currentProxyConfig = null;

  ipcMain.on('proxy-config', (e, cfg) => {
    currentProxyConfig = cfg;
    if (!mainWindow || mainWindow.isDestroyed()) return;
    try {
      if (cfg && cfg.enabled && cfg.host && cfg.port) {
        const proxyUrl = `${cfg.protocol}://${cfg.host}:${cfg.port}`;
        mainWindow.webContents.session.setProxy({
          proxyRules: proxyUrl,
          proxyBypassRules: '<local>',
        });
      } else {
        mainWindow.webContents.session.setProxy({
          proxyRules: '',
          proxyBypassRules: '',
        });
      }
    } catch (e) { console.error('proxy config error:', e); }
  });

  // Handle proxy auth
  mainWindow.webContents.session.on('login', (event, requestInfo, authInfo, callback) => {
    if (currentProxyConfig && currentProxyConfig.enabled && currentProxyConfig.username) {
      event.preventDefault();
      callback(currentProxyConfig.username, currentProxyConfig.password || '');
    }
  });

  ipcMain.handle('test-proxy', async (e, cfg) => {
    return new Promise(resolve => {
      if (!cfg.host || !cfg.port) return resolve({ ok: false, error: 'No host/port' });
      const start = Date.now();
      const mod = cfg.protocol === 'https' ? https : http;
      const opts = {
        hostname: cfg.host,
        port: parseInt(cfg.port),
        path: 'https://api.openai.com/v1/models',
        method: 'CONNECT',
        timeout: 8000,
      };
      if (cfg.username && cfg.password) {
        opts.headers = { 'Proxy-Authorization': 'Basic ' + Buffer.from(cfg.username + ':' + cfg.password).toString('base64') };
      }
      const req = mod.request(opts, (res) => {
        const ms = Date.now() - start;
        resolve({ ok: true, ms, status: res.statusCode });
      });
      req.on('error', (err) => resolve({ ok: false, error: err.message }));
      req.on('timeout', () => { req.destroy(); resolve({ ok: false, error: 'Timeout' }); });
      req.end();
    });
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
