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
            :disabled="mqtt.checkConnection()"
            @click.left="createConnection()"
          >
            Bağlan
          </ElButton>
        </div>
        <div class="flex justify-end items-center gap-3">
          <div class="flex justify-center items-center gap-2">
            <div class="font-bold">ID:</div>
            <div>
              <div class="text-sm">{{ client.getClientId() }}</div>
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, computed, ref } from 'vue'
import type { Ref } from 'vue'
import { ElNotification, ElIcon, ElButton, ElTooltip } from 'element-plus'
import { Loading, CircleCheck, CopyDocument, CircleClose } from '@element-plus/icons-vue'
import { debounce, commandTypes, mqttTopics, stringHexToBuffer } from '@remote-uart/shared'
import type { TConnectionTypes, TUartCommand } from '@remote-uart/shared'
import { useClient } from '@/composables/Client'
import { useSerialPort } from '@/composables/SerialPort'
import { useMQTT } from '@/composables/MQTT'
import { connectionTypes } from '@/enums'
import SerialPort from '@/components/SerialPort.vue'

const client = useClient()
const mqtt = useMQTT()
const serialPort = useSerialPort()

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
  mqttConnectionType.value = connectionTypes.notConnected
}

function closeConnection() {
  mqttConnectionType.value = connectionTypes.connectionClosing
  mqtt.closeConnection()
  connectionClosedOperations()
}

function createConnection() {
  mqttConnectionType.value = connectionTypes.connecting

  mqtt.connect()
  const mqttConnection = mqtt.getConnection()

  mqttConnection.on('connect', () => {
    mqttConnectionType.value = connectionTypes.connected
    mqttConnection.subscribe([
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

  mqttConnection.on('message', (_topic, _payload, packet) => {
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
        const incomingCommand = JSON.parse(packet.payload.toString()) as TUartCommand

        if (serialPort.checkConnection()) {
          serialPort.sendData(
            incomingCommand.type == commandTypes.hex
              ? stringHexToBuffer(incomingCommand.command)
              : incomingCommand.command
          )
        }
        return

      case mqttTopics.client.deviceDebug(client.getClientId()):
        if (serialPort.checkConnection()) {
          serialPort.getConnection().write(packet.payload)
        } else {
          debounce(() => {
            ElNotification({
              type: 'error',
              title: 'UART Bağlantı Hatası',
              message: 'UART bağlantısı olmadığı için Server verisi gönderilemedi',
            })
          }, 3000)()
        }
        return
    }
  })

  mqttConnection.on('close', () => {
    ElNotification({
      type: 'error',
      message: 'Server Bağlantısı Kapandı',
    })
    closeConnection()
  })

  mqttConnection.on('error', (error) => {
    ElNotification({
      type: 'error',
      message: error.message,
    })
    closeConnection()
  })
}

function copyClientId() {
  window.navigator.clipboard.writeText(client.getClientId())
  ElNotification({
    type: 'success',
    message: 'ID Kopyalandı',
  })
}

onMounted(() => {
  serialPort.getActivePorts()
  createConnection()
})

onBeforeUnmount(() => {
  closeConnection()
})
</script>
