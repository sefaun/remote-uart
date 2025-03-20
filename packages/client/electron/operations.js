const { ipcMain } = require('electron/main')
const serialport = require('./serialport')

/**
 * Front-end ile ilgili işlemler yapılır.
 * @param {win: BrowserWindow, opts: {mainFolder: string}} opts
 */
function operations(win, opts) {
  /**
   * Aktif COMPORT'ları getirir.
   */
  ipcMain.handle(enums.routes.getActiveCOMPORTs, async (_event) => {
    try {
      const ports = await serialport.getActiveCOMPORTs()

      return response({
        status: true,
        data: ports,
      })
    } catch (err) {
      return response({
        status: false,
        error: err,
      })
    }
  })

  /**
   * Aktif COMPORT serial bağlantısı kontrol eder.
   */
  ipcMain.handle(enums.routes.checkSerialConnection, async (_event) => {
    try {
      const result = serialport.checkSerialConnection()

      return response({
        status: true,
        data: result ? true : false,
      })
    } catch (err) {
      return response({
        status: false,
        error: err,
      })
    }
  })

  /**
   * COMPORT'a veri gönderilir.
   */
  ipcMain.handle(enums.routes.sendSerialData, (_event, data) => {
    try {
      serialport.sendSerialData(data)

      return response({
        status: true,
      })
    } catch (err) {
      return response({
        status: false,
        error: err,
      })
    }
  })
}

module.exports = operations
