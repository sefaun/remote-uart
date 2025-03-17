const { app, BrowserWindow } = require('electron/main')
const path = require('node:path')

const mainFolder = process.cwd()
let splashWindow

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 350,
    height: 100,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    center: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  splashWindow.loadURL(path.join(__dirname, 'splash.html'))
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1250,
    height: 755,
    minWidth: 1250,
    minHeight: 755,
    autoHideMenuBar: true,
    titleBarStyle: 'default',
    transparent: false,
    show: false,
    webPreferences: {
      devTools: true,
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: true,
    },
  })

  // win.loadURL(path.join(__dirname, '../build/index.html'))
  win.loadURL('http://localhost:5173')

  win.webContents.openDevTools({
    mode: 'detach',
  })

  win.on('ready-to-show', () => {
    setTimeout(() => {
      splashWindow.destroy() // Splash ekranı kapat
      win.show() // Ana pencereyi göster
    }, 2000)
  })
}

app.whenReady().then(() => {
  createSplashWindow()
  createWindow()

  //Masaüstü bildiriminde app ismi gösterilecek.
  if (process.platform == 'win32') {
    app.setAppUserModelId(app.name)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
