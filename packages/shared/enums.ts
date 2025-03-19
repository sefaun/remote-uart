export const connectionTypes = {
  connect: 'connect',
  connected: 'connected',
  connecting: 'connecting',
  connectionClosing: 'connectionClosing',
} as const

export const mqttTopics = {
  admin: {
    mqttConnectionStatus: (id: string) => 'admin/' + id + '/mqttConnectionStatus',
    file: (id: string) => 'admin/' + id + '/file',
    uartStatus: (id: string) => 'admin/' + id + '/uartStatus',
    uartChannel: (id: string) => 'admin/' + id + '/uartChannel',
  },
  client: {
    mqttConnectionStatus: (id: string) => 'client/' + id + '/mqttConnectionStatus',
    file: (id: string) => 'client/' + id + '/file',
    uartStatus: (id: string) => 'client/' + id + '/uartStatus',
    uartChannel: (id: string) => 'client/' + id + '/uartChannel',
  },
} as const
