import { baudRate, dataBits, parity, stopBits, flowControl } from '@/enums'

export type TBaudRate = (typeof baudRate)[number]
export type TDataBits = (typeof dataBits)[number]
export type TStopBits = (typeof stopBits)[number]
export type TParity = (typeof parity)[number]
export type TFlowControl = (typeof flowControl)[number]

export type TSerialPortOptions = {
  path: string
  baudRate: TBaudRate
  dataBits: TDataBits
  stopBits: TStopBits
  parity: TParity
  flowControl: TFlowControl
}

export type TActiveSerialPortsPayload = {
  path: string
  manufacturer: string
  serialNumber: string
  pnpId: string
  locationId: string
  friendlyName: string
  vendorId: string
  productId: string
}

export type TSerialPortOpenOptions = {
  path: string
  baudRate?: number
  parity?: string
  dataBits?: number
  stopBits?: number
  rtscts?: boolean
}
