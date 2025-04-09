const { app, BrowserWindow } = require('electron/main')
const path = require('node:path')

const development = process.env.NODE_MODE == 'development'
let splashWindow

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 200,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    center: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  splashWindow.loadURL(path.join(__dirname, 'splash.html'))
}

function createWindow() {
  const win = new BrowserWindow({
    title: 'Vili TCP/IP Com PORTS Redirector (Master)',
    width: 1080,
    height: 600,
    minWidth: 1080,
    minHeight: 600,
    autoHideMenuBar: true,
    titleBarStyle: 'default',
    transparent: false,
    show: false,
    webPreferences: {
      devTools: development,
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (development) {
    win.loadURL('http://localhost:3000')
  } else {
    win.loadURL(path.join(__dirname, '../dist/index.html'))
  }

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
