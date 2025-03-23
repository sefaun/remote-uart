import type { ValueOf } from './global-types.js'
import { commandTypes, connectionTypes, baudRate, dataBits, stopBits, parity, flowControl } from './enums.js'

export type TTheme = 'dark' | 'light'

export type TConnectionTypes = ValueOf<typeof connectionTypes>
export type TCommandTypes = ValueOf<typeof commandTypes>

export type TUartCommand = {
  command: string
  type: TCommandTypes
  time: string
}

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
