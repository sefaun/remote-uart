const { SerialPort } = require('serialport')
const { randomUUID } = require('crypto')
const { enums } = require('./enums')

let serials = {}

function getActiveCOMPORTs() {
  return SerialPort.list()
}

function connectSerialPort(win, options) {
  return new Promise((resolve, reject) => {
    const id = randomUUID()
    serials[id] = new SerialPort({
      ...options,
      rtscts: true,
      // path: 'COM10',
      // baudRate: 9600,
      // parity: 'even',
      // dataBits: 8,
      // stopBits: 1,
    })

    //Bağlantı sağlandığında çalışır
    serials[id].on('open', () => {
      win.webContents.send(enums.ipcEvents.serialConnectionOpen, { id })
      return resolve(id)
    })
    //karşı taraftan comport kapandığında burası çalışır.
    serials[id].on('close', () => {
      win.webContents.send(enums.ipcEvents.closedSerialPort, { id })
    })
    //karşıdan gelen verileri alır
    serials[id].on('data', (data) => {
      win.webContents.send(enums.ipcEvents.listenSerialData, { id, data })
    })
    //Bağlantı sağlanamazsa burası çalışır
    serials[id].on('error', (err) => {
      win.webContents.send(enums.ipcEvents.listenSerialError, { id, err })
      return reject()
    })
  })
}

function closeSerialPort() {
  return new Promise((resolve, reject) => {
    if (serials[id] && serials[id].isOpen) {
      serials[id].removeAllListeners()
      serials[id].close((err) => {
        if (err) {
          return reject(err)
        }
        delete serials[id]
        return resolve()
      })
    }
  })
}

function checkSerialConnection() {
  return serials[id]?.isOpen || false
}

function sendSerialData(data) {
  if (serials[id] && serials[id].isOpen) {
    serials[id].write(data + '\r\n')
  }
}

module.exports = {
  getActiveCOMPORTs,
  connectSerialPort,
  closeSerialPort,
  sendSerialData,
  checkSerialConnection,
}
