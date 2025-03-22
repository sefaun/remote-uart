import { ref } from 'vue'
import type { Ref } from 'vue'
import type { TActiveSerialPortsPayload, TSerialPortOpenOptions, TSerialPortOptions } from '@/types'
const { SerialPort } = require('serialport') as typeof import('serialport')

const serialportInfo = 'serialportInfo'
const serialConnection = ref()
const serialConnectionStatus = ref(false)
const activePorts = ref([])
const serialPortSettings: Ref<TSerialPortOptions> = ref({
  path: '',
  baudRate: '38400',
  dataBits: '8',
  stopBits: '1',
  parity: 'none',
  flowControl: 'None',
})

export function useSerialPort() {
  async function getActivePorts(): Promise<TActiveSerialPortsPayload[]> {
    activePorts.value = await SerialPort.list()
    return activePorts.value
  }

  function getPortSettings(): TSerialPortOptions {
    const result = localStorage.getItem(serialportInfo)
    if (result) {
      return JSON.parse(result)
    }

    return serialPortSettings.value
  }

  function getSerialConnectionStatus() {
    return serialConnectionStatus.value
  }

  function setSerialConnectionStatus(value: boolean) {
    serialConnectionStatus.value = value
  }

  function setPortSettings(data: TSerialPortOptions) {
    localStorage.setItem(serialportInfo, JSON.stringify(data))
    serialPortSettings.value = getPortSettings()
  }

  function createSerialPort(options: TSerialPortOpenOptions) {
    serialConnection.value = new SerialPort({
      path: getPortSettings(),
      baudRate: 9600,
      parity: 'even',
      dataBits: 8,
      stopBits: 1,
      rtscts: true,
      ...options,
    })

    //bağlantı sağlandığında burası çalışır
    serialConnection.value.on('open', () => {
      setSerialConnectionStatus(true)
    })
    //karşı taraftan comport kapandığında burası çalışır.
    serialConnection.value.on('close', () => {
      setSerialConnectionStatus(false)
    })
    //karşıdan gelen verileri alır
    serialConnection.value.on('data', (data: any) => {
      console.log(data, 'serial veri')
    })
    //Bağlantı sağlanamazsa burası çalışır
    serialConnection.value.on('error', (_err: Error) => {
      setSerialConnectionStatus(false)
    })
  }

  function closeSerialPort() {
    return new Promise((resolve, reject) => {
      if (serialConnection.value && serialConnection.value.isOpen) {
        serialConnection.value.removeAllListeners()
        serialConnection.value.close((err: Error) => {
          if (err) {
            return reject(err)
          }

          serialConnection.value = null
          setSerialConnectionStatus(false)
          return resolve(true)
        })
      }
    })
  }

  function checkConnection() {
    return serialConnection.value?.isOpen || false
  }

  function sendData(data: Buffer) {
    if (serialConnection.value && serialConnection.value.isOpen) {
      serialConnection.value.write(data + '\r\n')
    }
  }

  return {
    getActivePorts,
    getPortSettings,
    getSerialConnectionStatus,
    setSerialConnectionStatus,
    setPortSettings,
    createSerialPort,
    closeSerialPort,
    checkConnection,
    sendData,
  }
}
