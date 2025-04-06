import { createServer } from 'node:net'
import Aedes from 'aedes'
const port = 1883

// @ts-ignore
const aedes = new Aedes()
const server = createServer(aedes.handle)

server.listen(port, function () {
  console.log('MQTT server listening on port ', port)

  // @ts-ignore
  aedes.on('publish', function (packet, _client) {
    console.log(console.log('publish packet:', packet.payload))
  })

  // @ts-ignore
  aedes.on('client', function (client) {
    console.log('new client', client.id)
  })
})
