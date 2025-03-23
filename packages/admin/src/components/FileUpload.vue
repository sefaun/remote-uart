<template>
  <div class="w-full h-screen">
    <div class="w-full h-full">
      <div
        class="h-[var(--navbar-height)] flex justify-between items-center flex-wrap bg-slate-300 dark:bg-gray-900 px-3"
      >
        <div>
          <div class="flex items-center gap-2">
            <div>Server Bağlantı Durumu:</div>
            <div>{{ mqttConnectionTypeIcon.name }}</div>
            <div class="flex items-center">
              <el-icon :color="mqttConnectionTypeIcon.color">
                <component :is="mqttConnectionTypeIcon.is" />
              </el-icon>
            </div>
          </div>
          <ElButton
            :loading="connectionType == connectionTypes.connecting"
            :disabled="connectionStatus"
            @click.left="createConnection()"
            type="success"
            size="small"
          >
            Bağlan
          </ElButton>
          <ElButton
            :loading="connectionType == connectionTypes.connectionClosing"
            :disabled="!connectionStatus"
            @click.left="closeConnection()"
            type="danger"
            size="small"
          >
            Bağlantı Kapat
          </ElButton>
        </div>
        <div class="flex justify-end items-center gap-2">
          <div class="flex justify-center items-center gap-2">
            <div>Admin ID:</div>
            <div>
              <div v-if="connectionType != connectionTypes.notConnected">{{ adminId }}</div>
              <ElInput
                v-else
                v-model="adminId"
                :minlength="adminIdLength.min"
                :maxlength="adminIdLength.max"
                class="!min-w-[300px]"
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
        <div>
          <div v-if="connectionType == connectionTypes.connected" class="flex justify-center items-center gap-2 mt-3">
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
                  <ElIcon :color="clientMqttConnection ? 'green' : 'red'">
                    <component :is="clientMqttConnection ? CircleCheck : CircleClose" />
                  </ElIcon>
                </div>
                <div>{{ clientMqttConnection ? 'Bağlı' : 'Bağlı Değil' }}</div>
              </div>
            </div>
          </div>
          <div class="flex justify-center items-center flex-wrap gap-2 mt-3">
            <div class="w-full flex items-center gap-2">
              <div>Client ID:</div>
              <div>
                <div v-if="connectionType != connectionTypes.notConnected" class="border rounded p-0.5">
                  {{ clientId }}
                </div>
                <ElInput v-else class="!min-w-[300px]" v-model="clientId" :maxlength="clientIdLength.max" />
              </div>
              <div v-if="connectionType == connectionTypes.connected" class="flex justify-center items-center">
                <ElButton
                  :icon="Refresh"
                  :loading="mqttClient.getConnectionControl()"
                  @click.left="manuelClientConnectionCheck()"
                  type="info"
                >
                  Client Bağlantı Kontrolü
                </ElButton>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="w-full flex justify-center p-3">
        <ElTabs class="w-full">
          <ElTabPane label="Client UART">
            <div class="w-full gap-3">
              <div>
                <ElButton
                  :disabled="!connectionStatus"
                  @click.left="checkAllClientUARTOptions()"
                  type="info"
                  size="small"
                >
                  UART Bilgilerini Kontrol Et
                </ElButton>
              </div>
              <div class="mt-3">
                <div class="flex items-center gap-2">
                  <div class="font-bold">Bağlantı Durumu:</div>
                  <div class="flex items-center gap-2">
                    <div class="flex items-center">
                      <ElIcon :color="uartConnectionStatus ? 'green' : 'red'">
                        <component :is="uartConnectionStatus ? CircleCheck : CircleClose" />
                      </ElIcon>
                    </div>
                    <div>{{ uartConnectionStatus ? 'Bağlı' : 'Bağlı Değil' }}</div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <div class="font-bold">Bağlantı Bilgileri:</div>
                  <div>
                    {{ uartConnectionOptions }}
                  </div>
                </div>
              </div>
            </div>
          </ElTabPane>
          <ElTabPane label="Dosya">
            <div class="w-full flex justify-center">
              <div class="w-[75%] h-full space-y-7">
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
                  @click.left="sendFile()"
                  class="w-full"
                  type="success"
                  size="large"
                >
                  Dosyayı Gönder
                </ElButton>
              </div>
            </div>
          </ElTabPane>
          <ElTabPane label="Komut">
            <div class="w-[500px] space-y-3">
              <div class="flex items-center gap-2">
                <ElInput
                  v-model="command"
                  :placeholder="commandType == commandTypes.hex ? 'Örnek: 020304050608' : 'Örnek: Merhaba'"
                  class="mt-1"
                >
                  <template #append>
                    <ElSelect v-model="commandType" class="!w-24">
                      <ElOption v-for="item of commandTypes" :label="item" :value="item" />
                    </ElSelect>
                  </template>
                </ElInput>
                <ElButton :icon="Position" @click.left="sendCommand()" type="success">Gönder</ElButton>
              </div>
              <div>
                <div class="font-bold">Gelen Cevap</div>
                <div class="flex items-center gap-1">
                  <div class="font-bold">Zaman:</div>
                  <div>
                    {{ uartCommandResponse?.time }}
                  </div>
                </div>
                <div class="flex items-center gap-1">
                  <div class="font-bold">Tip:</div>
                  <div>
                    {{ uartCommandResponse?.type }}
                  </div>
                </div>
                <div class="flex items-center gap-1">
                  <div class="font-bold">Cevap:</div>
                  <div>
                    {{ uartCommandResponse?.command }}
                  </div>
                </div>
              </div>
            </div>
          </ElTabPane>
        </ElTabs>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, computed, ref } from 'vue'
import type { Ref } from 'vue'
import {
  ElNotification,
  ElIcon,
  ElUpload,
  ElInput,
  ElButton,
  ElTooltip,
  ElTabs,
  ElTabPane,
  ElSelect,
  ElOption,
} from 'element-plus'
import type { UploadFile, UploadFiles } from 'element-plus'
import {
  UploadFilled,
  Loading,
  CircleCheck,
  CopyDocument,
  CircleClose,
  Refresh,
  Position,
} from '@element-plus/icons-vue'
import { isJSON, mqttTopics, connectionTypes, commandTypes } from '@remote-uart/shared'
import type { TCommandTypes, TConnectionTypes, TUartCommand } from '@remote-uart/shared'
import { useMQTT } from '@/composables/MQTT'
import { useMqttClient } from '@/composables/MqttClient'

const mqtt = useMQTT()
const mqttClient = useMqttClient()

const connectionStatus = ref(false)
const connectionType: Ref<TConnectionTypes> = ref(connectionTypes.notConnected)
const uartCommandResponse: Ref<TUartCommand> = ref()
const adminId = ref('')
const clientId = ref('')
const command = ref('')
const commandType: Ref<TCommandTypes> = ref(commandTypes.hex)
const uartConnectionStatus = ref(false)
const adminIdDisabled = ref(false)
const clientConnectionStatus = ref(false)
const uartConnectionOptions = ref({})
const selectedFile = ref([])
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

const mqttConnectionTypeIcon = computed(() => {
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

const clientMqttConnection = computed(
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

function sendCommandValidation() {
  if (command.value.length == 0) {
    ElNotification({
      type: 'warning',
      message: 'Komut boş olamaz',
    })
    return false
  }

  if (commandType.value == commandTypes.hex && command.value.length % 2 != 0) {
    ElNotification({
      type: 'warning',
      message: 'Komut uzunluğu çift sayı olmalıdır',
    })
    return false
  }

  if (commandType.value == commandTypes.hex && !/^[0-9a-fA-F]+$/.test(command.value)) {
    ElNotification({
      type: 'warning',
      message: 'Komut sadece hexadecimal karakterlerden oluşabilir',
    })
    return false
  }

  if (commandType.value == commandTypes.string && command.value.length > 255) {
    ElNotification({
      type: 'warning',
      message: 'Komut 255 karakterden uzun olamaz',
    })
    return false
  }

  return true
}

function sendCommand() {
  if (!sendCommandValidation()) {
    return
  }

  mqtt.getConnection().publish(
    mqttTopics.client.uartCommand(clientId.value),
    JSON.stringify({
      type: commandType.value,
      command: command.value,
      time: new Date().toLocaleString(),
    } as TUartCommand)
  )
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
  connectionType.value = connectionTypes.notConnected
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

  localStorage.setItem(localStorageClientIdKey, clientId.value)

  connectionType.value = connectionTypes.connecting
  const connection = mqtt.connect()

  connection.on('connect', () => {
    connectionStatus.value = true
    adminIdDisabled.value = true
    connectionType.value = connectionTypes.connected
    mqttClient.checkClientMqttConnectionStatus(clientId.value)
    connection.subscribe([
      mqttTopics.admin.mqttConnectionStatus(clientId.value),
      mqttTopics.admin.uartChannelOptions(clientId.value),
      mqttTopics.admin.uartStatus(clientId.value),
      mqttTopics.admin.uartCommand(clientId.value),
    ])

    ElNotification({
      type: 'success',
      message: 'Server Bağlantısı Sağlandı',
    })

    manuelClientConnectionCheck()
    checkUARTOptions()
    checkUARTConnection()
  })

  connection.on('message', (_topic, _payload, packet) => {
    switch (packet.topic) {
      case mqttTopics.admin.mqttConnectionStatus(clientId.value):
        mqttClient.setConnectionControl(false)
        clientConnectionStatus.value = true
        return

      case mqttTopics.admin.uartChannelOptions(clientId.value):
        uartConnectionOptions.value = isJSON(packet.payload.toString()) ? JSON.parse(packet.payload.toString()) : {}
        return

      case mqttTopics.admin.uartStatus(clientId.value):
        uartConnectionStatus.value = packet.payload.toString() == 'true'
        return

      case mqttTopics.admin.uartCommand(clientId.value):
        uartCommandResponse.value = isJSON(packet.payload.toString()) ? JSON.parse(packet.payload.toString()) : {}
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

function manuelClientConnectionCheck() {
  mqttClient.setConnectionControl(true)
  mqtt.getConnection().publish(mqttTopics.client.mqttConnectionStatus(clientId.value), 'ping')
}

function checkUARTConnection() {
  mqtt.getConnection().publish(mqttTopics.client.uartStatus(clientId.value), '')
}

function checkUARTOptions() {
  mqtt.getConnection().publish(mqttTopics.client.uartChannelOptions(clientId.value), '')
}

function checkAllClientUARTOptions() {
  checkUARTConnection()
  checkUARTOptions()
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
  closeConnection()
})
</script>
