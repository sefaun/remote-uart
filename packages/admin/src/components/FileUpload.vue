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
        <div class="flex justify-end items-center gap-2">
          <div class="flex justify-center items-center gap-2">
            <div>Admin ID:</div>
            <div>
              <div v-if="connectionType != connectionTypes.connect">{{ adminId }}</div>
              <ElInput
                v-else
                class="!min-w-[300px]"
                v-model="adminId"
                :minlength="adminIdLength.min"
                :maxlength="adminIdLength.max"
              />
            </div>
          </div>
          <div>
            <ElTooltip class="box-item" effect="dark" content="Kopyala" placement="bottom-end">
              <ElIcon @click.stop="copyClientId()" class="cursor-pointer"><CopyDocument /></ElIcon>
            </ElTooltip>
          </div>
        </div>
      </div>
      <div class="w-full flex justify-center items-center">
        <div class="w-[75%] h-full space-y-7 mt-20">
          <div class="flex justify-center items-center flex-wrap gap-2">
            <div class="flex items-center gap-2">
              <div>Client ID:</div>
              <div>
                <div v-if="connectionType != connectionTypes.connect" class="border rounded p-0.5">{{ clientId }}</div>
                <ElInput v-else class="!min-w-[300px]" v-model="clientId" :maxlength="clientIdLength.max" />
              </div>
            </div>
          </div>
          <div v-if="connectionType == connectionTypes.connected" class="flex justify-center items-center gap-2">
            <div v-if="mqttClient.getConnectionControl()">
              <div class="flex items-center gap-2">
                <div class="flex items-center">
                  <ElIcon color="orange">
                    <Loading />
                  </ElIcon>
                </div>
                <div>Bağlantı Kontrol Ediliyor</div>
              </div>
            </div>
            <div v-else>
              <div class="flex items-center gap-2">
                <div class="flex items-center">
                  <ElIcon :color="clientConnection ? 'green' : 'red'">
                    <component :is="clientConnection ? CircleCheck : CircleClose" />
                  </ElIcon>
                </div>
                <div>{{ clientConnection ? 'Bağlı' : 'Bağlı Değil' }}</div>
              </div>
            </div>
            <div>
              <ElButton
                type="info"
                :icon="Refresh"
                :loading="mqttClient.getConnectionControl()"
                @click.left="manuelClientConnectionCheck()"
              >
                Client Bağlantı Kontrol
              </ElButton>
            </div>
          </div>
          <div class="w-full flex justify-center items-center">
            <ElUpload
              v-model:file-list="selectedFile"
              :auto-upload="false"
              :limit="1"
              :on-change="handleChange"
              drag
              class="w-full"
            >
              <ElIcon class="!text-6xl mb-4"><UploadFilled /></ElIcon>
              <div class="text-center text-sm">
                Dosyayı buraya sürükleyin veya
                <em>yükleme ekranına tıklayın</em>
              </div>
              <template #tip>
                <div>.bin dosyası yüklenebilir</div>
              </template>
            </ElUpload>
          </div>
          <ElButton
            :disabled="!(connectionType == connectionTypes.connected && selectedFile.length != 0)"
            class="w-full"
            type="success"
            size="large"
            @click.left="sendFile()"
          >
            Dosyayı Gönder
          </ElButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, computed, ref } from 'vue'
import type { Ref } from 'vue'
import { ElNotification, ElIcon, ElUpload, ElInput, ElButton, ElTooltip } from 'element-plus'
import type { UploadFile, UploadFiles } from 'element-plus'
import {
  UploadFilled,
  Loading,
  CircleCheck,
  Connection,
  CopyDocument,
  CircleClose,
  Refresh,
} from '@element-plus/icons-vue'
import { mqttTopics } from '@remote-uart/shared'
import { useMQTT } from '@/composables/MQTT'
import { useMqttClient } from '@/composables/MqttClient'
import { connectionTypes } from '@/enums'
import type { TConnectionTypes } from '@/types'

const mqtt = useMQTT()
const mqttClient = useMqttClient()

const incomingMessage = ref()
const connectionStatus = ref(false)
const connectionType: Ref<TConnectionTypes> = ref(connectionTypes.connect)
const adminId = ref('')
const clientId = ref('')
const selectedFile = ref([])
const adminIdDisabled = ref(false)
const clientConnectionStatus = ref(false)
const localStorageAdminIdKey: string = import.meta.env.VITE_ADMIN_ID
const localStorageClientIdKey: string = import.meta.env.VITE_CLIENT_ID
let uploadFileContent: Uint8Array = null
const adminIdLength = {
  min: 4,
  max: 36,
}
const clientIdLength = {
  max: 36,
}

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

const clientConnection = computed(
  () => connectionType.value == connectionTypes.connected && clientConnectionStatus.value
)

function connectionValidation() {
  if (adminId.value.length < adminIdLength.min || adminId.value.length > adminIdLength.max) {
    ElNotification({
      type: 'warning',
      message: 'Admin ID en az 4 en fazla 36 karakter olabilir',
    })
    return false
  }

  if (clientId.value.length != clientIdLength.max) {
    ElNotification({
      type: 'warning',
      message: 'Client ID 36 karakter olmalıdır',
    })
    return false
  }

  return true
}

async function handleChange(uploadFile: UploadFile, _uploadFiles: UploadFiles) {
  uploadFileContent = await uploadFile.raw.bytes()
}

function sendFile() {
  mqtt.getConnection().publish(mqttTopics.client.file(clientId.value), uploadFileContent as Uint8Array as Buffer)
  ElNotification({
    type: 'success',
    message: 'Dosya Gönderildi',
  })
}

function connectionClosedOperations() {
  connectionStatus.value = false
  adminIdDisabled.value = false
  clientConnectionStatus.value = false
  connectionType.value = connectionTypes.connect
  mqttClient.closeCheckClientMqttConnectionStatus()
}

function closeConnection() {
  connectionType.value = connectionTypes.connectionClosing
  mqtt.closeConnection(true)
  connectionClosedOperations()
}

function createConnection() {
  if (!connectionValidation()) {
    return
  }

  connectionType.value = connectionTypes.connecting
  const connection = mqtt.connect()

  connection.on('connect', () => {
    connectionStatus.value = true
    adminIdDisabled.value = true
    connectionType.value = connectionTypes.connected
    mqttClient.checkClientMqttConnectionStatus(clientId.value)
    connection.subscribe([
      mqttTopics.admin.mqttConnectionStatus(clientId.value),
      mqttTopics.admin.uartChannel(clientId.value),
      mqttTopics.admin.uartStatus(clientId.value),
    ])
    ElNotification({
      type: 'success',
      message: 'Bağlantı Sağlandı',
    })
  })

  connection.on('message', (_topic, _payload, packet) => {
    switch (packet.topic) {
      case mqttTopics.admin.mqttConnectionStatus(clientId.value):
        mqttClient.setConnectionControl(false)
        clientConnectionStatus.value = true
        return
      case mqttTopics.admin.uartChannel(clientId.value):
        //
        return
      case mqttTopics.admin.uartStatus(clientId.value):
        //
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

function manuelClientConnectionCheck() {
  mqttClient.setConnectionControl(true)
  mqtt.getConnection().publish(mqttTopics.client.mqttConnectionStatus(clientId.value), 'ping')
}

function copyClientId() {
  window.navigator.clipboard.writeText(clientId.value)
  ElNotification({
    type: 'success',
    message: 'ID Kopyalandı',
  })
}

function setStartingOperations() {
  const localAdminData = localStorage.getItem(localStorageAdminIdKey)
  const localClientData = localStorage.getItem(localStorageClientIdKey)

  if (!localAdminData) {
    adminId.value = window.crypto.randomUUID()
    localStorage.setItem(localStorageAdminIdKey, adminId.value)
  } else {
    adminId.value = localAdminData
  }

  if (localClientData) {
    clientId.value = localClientData
  }
}

onMounted(() => {
  setStartingOperations()
})

onBeforeUnmount(() => {
  mqtt.closeConnection(true)
})
</script>
