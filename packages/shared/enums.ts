export const connectionTypes = {
  notConnected: 'notConnected',
  connected: 'connected',
  connecting: 'connecting',
  connectionClosing: 'connectionClosing',
} as const

export const baudRate = [
  '300',
  '600',
  '1200',
  '2400',
  '4800',
  '9600',
  '14400',
  '19200',
  '38400',
  '56000',
  '57600',
  '115200',
  '128000',
  '256000',
] as const
export const dataBits = ['5', '6', '7', '8'] as const
export const stopBits = ['1', '1.5', '2'] as const
export const parity = ['none', 'odd', 'even', 'mark', 'space'] as const
export const flowControl = ['None', 'Hardware', 'Software', 'Custom'] as const

export const commandTypes = {
  hex: 'Hex',
  string: 'String',
} as const

export const mqttTopics = {
  admin: {
    mqttConnectionStatus: (id: string) => 'admin/' + id + '/mqttConnectionStatus',
    uartStatus: (id: string) => 'admin/' + id + '/uartStatus',
    uartChannelOptions: (id: string) => 'admin/' + id + '/uartChannelOptions',
    uartCommand: (id: string) => 'admin/' + id + '/uartCommand',
    deviceDebug: (id: string) => 'admin/' + id + '/deviceDebug',
  },
  client: {
    mqttConnectionStatus: (id: string) => 'client/' + id + '/mqttConnectionStatus',
    uartStatus: (id: string) => 'client/' + id + '/uartStatus',
    uartChannelOptions: (id: string) => 'client/' + id + '/uartChannelOptions',
    uartCommand: (id: string) => 'client/' + id + '/uartCommand',
    deviceDebug: (id: string) => 'client/' + id + '/deviceDebug',
  },
} as const
