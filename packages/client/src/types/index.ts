export type TSerialPortOpenOptions = {
  path: string
  baudRate?: number
  parity?: string
  dataBits?: number
  stopBits?: number
  rtscts?: boolean
}
