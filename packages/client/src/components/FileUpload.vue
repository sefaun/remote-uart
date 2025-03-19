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
          <ElButton
            type="danger"
            size="small"
            :loading="connectionType == connectionTypes.connectionClosing"
            :disabled="!connectionStatus"
            @click.left="closeConnection()"
          >
            Bağlantı Kapat
          </ElButton>
        </div>
        <div class="flex justify-end items-center gap-3">
          <div class="flex justify-center items-center gap-2">
            <div>ID:</div>
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
      <div>
        programlama işlemi başladı
        <ElProgress :percentage="100" :stroke-width="15" status="success" striped striped-flow :duration="10" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, computed, ref } from 'vue'
import type { Ref } from 'vue'
import { ElNotification, ElIcon, ElProgress, ElButton, ElTooltip } from 'element-plus'
import { Loading, CircleCheck, Connection, CopyDocument } from '@element-plus/icons-vue'
import { useMQTT } from '@/composables/MQTT'
import { connectionTypes } from '@/enums'
import { mqttTopics, type TConnectionTypes } from '@remote-uart/shared'

const mqtt = useMQTT()

const incomingMessage: Ref<string | Buffer> = ref()
const connectionStatus = ref(false)
const connectionType: Ref<TConnectionTypes> = ref(connectionTypes.connect)
const clientId: Ref<string> = ref(window.crypto.randomUUID())
const localStorageClientIdKey: string = import.meta.env.VITE_CLIENT_ID

const connectionTypeIcon = computed(() => {
  switch (connectionType.value) {
    case connectionTypes.connect:
      return {
        is: Connection,
        name: 'Bağlan',
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
        name: 'Bağlandı',
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

function uartChannelEvent(channels: []) {
  sendData(mqttTopics.admin.uartChannel(clientId.value), JSON.stringify(channels))
}

function sendData(topic: string, data: string | Buffer) {
  mqtt.getConnection().publish(topic, data)
}

function connectionClosedOperations() {
  connectionStatus.value = false
  connectionType.value = connectionTypes.connect
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
      mqttTopics.client.uartChannel(clientId.value),
      mqttTopics.client.uartStatus(clientId.value),
      mqttTopics.client.file(clientId.value),
    ])

    ElNotification({
      type: 'success',
      message: 'Bağlantı Sağlandı',
    })
  })

  connection.on('message', (_topic, _payload, packet) => {
    switch (packet.topic) {
      case mqttTopics.client.mqttConnectionStatus(clientId.value):
        mqttConnectionStatusEvent(true)
        return

      case mqttTopics.client.uartChannel(clientId.value):
        uartChannelEvent([])
        return

      case mqttTopics.client.uartStatus(clientId.value):
        uartStatusEvent(true)
        return

      case mqttTopics.client.file(clientId.value):
        incomingMessage.value = packet.payload
        return
    }
  })

  connection.on('close', () => {
    ElNotification({
      type: 'error',
      message: 'Bağlantı Kapandı',
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

function copyClientId() {
  window.navigator.clipboard.writeText(clientId.value)
  ElNotification({
    type: 'success',
    message: 'ID Kopyalandı',
  })
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
  setStartingOperations()
})

onBeforeUnmount(() => {
  mqtt.closeConnection(true)
})
</script>
