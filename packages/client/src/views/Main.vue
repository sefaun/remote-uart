<template>
  <div class="w-full h-screen">
    <div class="w-full h-full">
      <div
        class="h-[var(--navbar-height)] flex justify-between items-center flex-wrap bg-slate-300 dark:bg-gray-900 px-3"
      >
        <div>
          <div class="flex items-center gap-2">
            <div>Server Bağlantı Durumu:</div>
            <div>{{ connectionTypeIcon.name }}</div>
            <div class="flex items-center">
              <el-icon :color="connectionTypeIcon.color">
                <component :is="connectionTypeIcon.is" />
              </el-icon>
            </div>
          </div>
          <ElButton
            type="success"
            size="small"
            :loading="connectionType == connectionTypes.connecting"
            :disabled="connectionStatus"
            @click.left="createConnection()"
          >
            Bağlan
          </ElButton>
        </div>
        <div class="flex justify-end items-center gap-3">
          <div class="flex justify-center items-center gap-2">
            <div class="font-bold">ID:</div>
            <div>
              <div>{{ clientId }}</div>
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
        <div>
          <div>UART Bağlantı Durumu: {{ serialPort.getSerialConnectionStatus() }}</div>
          <ElButton
            :disabled="serialPort.getSerialConnectionStatus()"
            @click.left="createSerialConnection()"
            type="success"
            size="small"
          >
            Bağlan
          </ElButton>
          <ElButton
            :disabled="!serialPort.getSerialConnectionStatus()"
            @click.left="closeSerialConnection()"
            type="danger"
            size="small"
          >
            Bağlan Kapat
          </ElButton>
          <ElButton @click.left="setUartOptionsDialog(true)" type="info" size="small">UART Ayarları</ElButton>
        </div>
        <div class="w-full flex justify-center mt-2">
          <ElTabs class="w-full">
            <ElTabPane label="Komut">
              <div>
                <div class="flex justify-between items-center gap-2">
                  <div class="font-bold">Gelen Komutlar</div>
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
            </ElTabPane>
            <ElTabPane label="Dosya">
              programlama işlemi başladı
              <ElProgress :percentage="100" :stroke-width="15" status="success" striped striped-flow :duration="10" />
            </ElTabPane>
          </ElTabs>
        </div>
      </div>
    </div>
  </div>
  <ElDialog v-model="uartOptionsDialog" title="UART Ayarları" width="300px">
    <SerialPort v-if="uartOptionsDialog" @close="closeUartOptionsDialog()"></SerialPort>
  </ElDialog>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, computed, ref } from 'vue'
import type { Ref } from 'vue'
import { ElNotification, ElIcon, ElProgress, ElButton, ElTooltip, ElDialog, ElTabs, ElTabPane } from 'element-plus'
import { Loading, CircleCheck, CopyDocument, CircleClose, Delete } from '@element-plus/icons-vue'
import { commandTypes, mqttTopics, stringHexToBuffer } from '@remote-uart/shared'
import type { TConnectionTypes, TUartCommand } from '@remote-uart/shared'
import { useSerialPort } from '@/composables/SerialPort'
import { useMQTT } from '@/composables/MQTT'
import { connectionTypes } from '@/enums'
import SerialPort from '@/components/SerialPort.vue'

const serialPort = useSerialPort()
const mqtt = useMQTT()

const uartOptionsDialog = ref(false)
const incomingMessage: Ref<string | Buffer> = ref()
const incomingCommand: Ref<TUartCommand> = ref()
const incomingCommands: Ref<TUartCommand[]> = ref([])
const connectionStatus = ref(false)
const connectionType: Ref<TConnectionTypes> = ref(connectionTypes.notConnected)
const clientId: Ref<string> = ref(window.crypto.randomUUID())
const localStorageClientIdKey: string = import.meta.env.VITE_CLIENT_ID

const connectionTypeIcon = computed(() => {
  switch (connectionType.value) {
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
  sendData(mqttTopics.admin.mqttConnectionStatus(clientId.value), value ? 'true' : 'false')
}

function uartStatusEvent(value: boolean) {
  sendData(mqttTopics.admin.uartStatus(clientId.value), value ? 'true' : 'false')
}

function uartChannelOptionsEvent() {
  sendData(mqttTopics.admin.uartChannelOptions(clientId.value), JSON.stringify(serialPort.getPortSettings()))
}

function sendData(topic: string, data: string | Buffer) {
  mqtt.getConnection().publish(topic, data)
}

function connectionClosedOperations() {
  connectionStatus.value = false
  connectionType.value = connectionTypes.notConnected
}

function closeConnection() {
  connectionType.value = connectionTypes.connectionClosing
  mqtt.closeConnection(true)
  connectionClosedOperations()
}

function createConnection() {
  connectionType.value = connectionTypes.connecting

  mqtt.connect()
  const connection = mqtt.getConnection()

  connection.on('connect', () => {
    connectionStatus.value = true
    connectionType.value = connectionTypes.connected
    connection.subscribe([
      mqttTopics.client.mqttConnectionStatus(clientId.value),
      mqttTopics.client.uartChannelOptions(clientId.value),
      mqttTopics.client.uartStatus(clientId.value),
      mqttTopics.client.uartCommand(clientId.value),
      mqttTopics.client.file(clientId.value),
    ])

    ElNotification({
      type: 'success',
      message: 'Server Bağlantısı Sağlandı',
    })
  })

  connection.on('message', (_topic, _payload, packet) => {
    switch (packet.topic) {
      case mqttTopics.client.mqttConnectionStatus(clientId.value):
        mqttConnectionStatusEvent(true)
        return

      case mqttTopics.client.uartChannelOptions(clientId.value):
        uartChannelOptionsEvent()
        return

      case mqttTopics.client.uartStatus(clientId.value):
        uartStatusEvent(serialPort.checkConnection())
        return

      case mqttTopics.client.uartCommand(clientId.value):
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

      case mqttTopics.client.file(clientId.value):
        incomingMessage.value = packet.payload
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
    connectionType.value = connectionTypes.connectionClosing
    ElNotification({
      type: 'error',
      message: error.message,
    })
    connection.end(true)
    connectionClosedOperations()
  })
}

function serialConnectionValidation() {
  if (!serialPort.getPortSettings().path) {
    ElNotification({
      type: 'error',
      message: 'Port Seçilmedi',
    })
    return false
  }

  return true
}

function closeSerialConnection() {
  serialPort.closeSerialPort()
}

function createSerialConnection() {
  if (!serialConnectionValidation()) {
    return
  }

  serialPort.createSerialPort({
    path: serialPort.getPortSettings().path,
  })
}

function copyClientId() {
  window.navigator.clipboard.writeText(clientId.value)
  ElNotification({
    type: 'success',
    message: 'ID Kopyalandı',
  })
}

function closeUartOptionsDialog() {
  setUartOptionsDialog(false)
  uartChannelOptionsEvent()
  serialPort.closeSerialPort()
}

function setUartOptionsDialog(value: boolean) {
  uartOptionsDialog.value = value
}

function clearIncomingCommands() {
  incomingCommands.value = []
}

function setStartingOperations() {
  const localData = localStorage.getItem(localStorageClientIdKey)

  if (!localData) {
    clientId.value = window.crypto.randomUUID()
    localStorage.setItem(localStorageClientIdKey, clientId.value)
  } else {
    clientId.value = localData
  }
}

onMounted(() => {
  serialPort.getActivePorts()
  setStartingOperations()
  createConnection()
})

onBeforeUnmount(() => {
  closeConnection()
})
</script>
