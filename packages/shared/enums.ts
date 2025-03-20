export const connectionTypes = {
  notConnected: 'notConnected',
  connected: 'connected',
  connecting: 'connecting',
  connectionClosing: 'connectionClosing',
} as const

export const mqttTopics = {
  admin: {
    mqttConnectionStatus: (id: string) => 'admin/' + id + '/mqttConnectionStatus',
    file: (id: string) => 'admin/' + id + '/file',
    uartStatus: (id: string) => 'admin/' + id + '/uartStatus',
    uartChannelOptions: (id: string) => 'admin/' + id + '/uartChannelOptions',
  },
  client: {
    mqttConnectionStatus: (id: string) => 'client/' + id + '/mqttConnectionStatus',
    file: (id: string) => 'client/' + id + '/file',
    uartStatus: (id: string) => 'client/' + id + '/uartStatus',
    uartChannelOptions: (id: string) => 'client/' + id + '/uartChannelOptions',
  },
} as const
