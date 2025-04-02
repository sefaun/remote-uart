<template>
  <div class="w-full h-screen">
    <div class="w-full h-full">
      <div class="h-20 flex justify-between items-center flex-wrap bg-slate-300 dark:bg-gray-900 px-3">
        <div>
          <div class="flex items-center gap-2">
            <div>Server Bağlantı Durumu:</div>
            <div>{{ mqttConnectionTypeIcon.name }}</div>
            <div class="flex items-center">
              <ElIcon :color="mqttConnectionTypeIcon.color">
                <component :is="mqttConnectionTypeIcon.is" />
              </ElIcon>
            </div>
          </div>
          <ElButton
            type="success"
            size="small"
            :loading="mqttConnectionType == connectionTypes.connecting"
            :disabled="mqttConnectionStatus"
            @click.left="createConnection()"
          >
            Bağlan
          </ElButton>
        </div>
        <div class="flex justify-end items-center gap-3">
          <div class="flex justify-center items-center gap-2">
            <div class="font-bold">ID:</div>
            <div>
              <div>{{ client.getClientId() }}</div>
            </div>
          </div>
          <div>
            <ElTooltip class="box-item" effect="dark" content="Kopyala" placement="bottom-end">
              <ElIcon @click.stop="copyClientId()" class="cursor-pointer"><CopyDocument /></ElIcon>
            </ElTooltip>
          </div>
        </div>
      </div>
      <div class="w-full p-3">
        <SerialPort></SerialPort>
        <div class="w-full flex justify-center mt-2">
          <div class="w-full mt-4">
            <div class="flex justify-between items-center gap-2">
              <div class="font-bold">Gelen Özel Komutlar</div>
              <div class="flex items-center gap-2">
                <ElButton :icon="Delete" @click.left="clearIncomingCommands()" type="danger" size="small">
                  Temizle
                </ElButton>
              </div>
            </div>
            <div class="w-full h-[400px] overflow-y-auto border rounded space-y-1 p-1 mt-2">
              <div v-for="command of incomingCommands" class="flex items-center gap-1 text-sm">
                <div class="font-bold">{{ command.time }} - {{ command.type }}:</div>
                <div>
                  {{ command.command }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, computed, ref } from 'vue'
import type { Ref } from 'vue'
import { ElNotification, ElIcon, ElButton, ElTooltip } from 'element-plus'
import { Loading, CircleCheck, CopyDocument, CircleClose, Delete } from '@element-plus/icons-vue'
import { commandTypes, mqttTopics, stringHexToBuffer } from '@remote-uart/shared'
import type { TConnectionTypes, TUartCommand } from '@remote-uart/shared'
import { useSerialPort } from '@/composables/SerialPort'
import { useMQTT } from '@/composables/MQTT'
import { connectionTypes } from '@/enums'
import SerialPort from '@/components/SerialPort.vue'
import { useClient } from '@/composables/Client'

const client = useClient()
const mqtt = useMQTT()
const serialPort = useSerialPort()

const incomingCommand: Ref<TUartCommand> = ref()
const incomingCommands: Ref<TUartCommand[]> = ref([])
const mqttConnectionStatus = ref(false)
const mqttConnectionType: Ref<TConnectionTypes> = ref(connectionTypes.notConnected)

const mqttConnectionTypeIcon = computed(() => {
  switch (mqttConnectionType.value) {
    case connectionTypes.notConnected:
      return {
        is: CircleClose,
        name: 'Bağlı Değil',
        color: 'red',
      }
    case connectionTypes.connecting:
      return {
        is: Loading,
        name: 'Bağlanıyor',
        color: 'orange',
      }
    case connectionTypes.connected:
      return {
        is: CircleCheck,
        name: 'Bağlı',
        color: 'green',
      }
    case connectionTypes.connectionClosing:
      return {
        is: Loading,
        name: 'Bağlantı Kapanıyor',
        color: 'orange',
      }
  }
})

function mqttConnectionStatusEvent(value: boolean) {
  sendData(mqttTopics.admin.mqttConnectionStatus(client.getClientId()), value ? 'true' : 'false')
}

function serialPortStatusEvent(value: boolean) {
  sendData(mqttTopics.admin.uartStatus(client.getClientId()), value ? 'true' : 'false')
}

function serialPortChannelOptionsEvent() {
  sendData(mqttTopics.admin.uartChannelOptions(client.getClientId()), JSON.stringify(serialPort.getPortSettings()))
}

function sendData(topic: string, data: string | Buffer) {
  mqtt.getConnection().publish(topic, data)
}

function connectionClosedOperations() {
  mqttConnectionStatus.value = false
  mqttConnectionType.value = connectionTypes.notConnected
}

function closeConnection() {
  mqttConnectionType.value = connectionTypes.connectionClosing
  mqtt.closeConnection(true)
  connectionClosedOperations()
}

function createConnection() {
  mqttConnectionType.value = connectionTypes.connecting

  mqtt.connect()
  const connection = mqtt.getConnection()

  connection.on('connect', () => {
    mqttConnectionStatus.value = true
    mqttConnectionType.value = connectionTypes.connected
    connection.subscribe([
      mqttTopics.client.mqttConnectionStatus(client.getClientId()),
      mqttTopics.client.uartChannelOptions(client.getClientId()),
      mqttTopics.client.uartStatus(client.getClientId()),
      mqttTopics.client.uartCommand(client.getClientId()),
      mqttTopics.client.deviceDebug(client.getClientId()),
    ])

    ElNotification({
      type: 'success',
      message: 'Server Bağlantısı Sağlandı',
    })
  })

  connection.on('message', (_topic, _payload, packet) => {
    switch (packet.topic) {
      case mqttTopics.client.mqttConnectionStatus(client.getClientId()):
        mqttConnectionStatusEvent(true)
        return

      case mqttTopics.client.uartChannelOptions(client.getClientId()):
        serialPortChannelOptionsEvent()
        return

      case mqttTopics.client.uartStatus(client.getClientId()):
        serialPortStatusEvent(serialPort.checkConnection())
        return

      case mqttTopics.client.uartCommand(client.getClientId()):
        incomingCommand.value = JSON.parse(packet.payload.toString()) as TUartCommand
        incomingCommands.value.push(incomingCommand.value)

        if (serialPort.checkConnection()) {
          serialPort.sendData(
            incomingCommand.value.type == commandTypes.hex
              ? stringHexToBuffer(incomingCommand.value.command)
              : incomingCommand.value.command
          )
        }
        return

      case mqttTopics.client.deviceDebug(client.getClientId()):
        //push serial
        return
    }
  })

  connection.on('close', () => {
    ElNotification({
      type: 'error',
      message: 'Server Bağlantısı Kapandı',
    })
    connectionClosedOperations()
  })

  connection.on('error', (error) => {
    mqttConnectionType.value = connectionTypes.connectionClosing
    ElNotification({
      type: 'error',
      message: error.message,
    })
    connection.end(true)
    connectionClosedOperations()
  })
}

function copyClientId() {
  window.navigator.clipboard.writeText(client.getClientId())
  ElNotification({
    type: 'success',
    message: 'ID Kopyalandı',
  })
}

function clearIncomingCommands() {
  incomingCommands.value = []
}

onMounted(() => {
  serialPort.getActivePorts()
  createConnection()
})

onBeforeUnmount(() => {
  closeConnection()
})
</script>
