import { createServer } from 'node:http'
import Aedes from 'aedes'
import ws from 'websocket-stream'
const port = 1883

// @ts-ignore
const aedes = new Aedes()
const httpServer = createServer()

ws.createServer({ server: httpServer }, aedes.handle)

httpServer.listen(port, function () {
  console.log('MQTT WS Server Listening on Port: ', port)

  // @ts-ignore
  aedes.on('publish', function (packet, client) {
    if (client) {
      console.log('Publish: ', client.id, packet.payload)
    }
  })

  // @ts-ignore
  aedes.on('client', function (client) {
    console.log('New Client: ', client.id)
  })
})
