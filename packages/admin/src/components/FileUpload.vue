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
            :loading="mqttConnectionType == connectionTypes.connecting"
            :disabled="mqttConnectionStatus"
            @click.left="createConnection()"
            type="success"
            size="small"
          >
            Bağlan
          </ElButton>
          <ElButton
            :loading="mqttConnectionType == connectionTypes.connectionClosing"
            :disabled="!mqttConnectionStatus"
            @click.left="closeMqttConnection()"
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
              <div v-if="mqttConnectionType != connectionTypes.notConnected">{{ adminId }}</div>
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
      <div class="w-full p-3">
        <SerialPort></SerialPort>
        <div class="w-full flex gap-5 mt-3">
          <ElTabs class="w-full">
            <ElTabPane label="Client İşlemleri">
              <div class="w-full flex items-center">
                <div>
                  <div v-if="mqttConnectionType == connectionTypes.connected" class="flex items-center gap-2">
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
                  <div class="flex items-center flex-wrap gap-2 mt-3">
                    <div class="w-full flex items-center gap-2">
                      <div>Client ID:</div>
                      <div>
                        <div v-if="mqttConnectionType != connectionTypes.notConnected" class="border rounded p-0.5">
                          {{ clientId }}
                        </div>
                        <ElInput v-else class="!min-w-[300px]" v-model="clientId" :maxlength="clientIdLength.max" />
                      </div>
                      <div
                        v-if="mqttConnectionType == connectionTypes.connected"
                        class="flex justify-center items-center"
                      >
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
              <div class="w-full gap-3 mt-10">
                <div>
                  <ElButton
                    :disabled="!mqttConnectionStatus"
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
                  <div class="space-y-1 mt-2">
                    <div class="font-bold">Bağlantı Bilgileri:</div>
                    <div v-if="isObject(uartConnectionOptions)" class="text-sm">
                      <div class="flex items-center gap-1">
                        <div class="font-bold">COM:</div>
                        <div>{{ uartConnectionOptions?.path }}</div>
                      </div>
                      <div class="flex items-center gap-1">
                        <div class="font-bold">Baudrate:</div>
                        <div>{{ uartConnectionOptions?.baudRate }}</div>
                      </div>
                      <div class="flex items-center gap-1">
                        <div class="font-bold">Parity:</div>
                        <div>{{ uartConnectionOptions?.parity }}</div>
                      </div>
                      <div class="flex items-center gap-1">
                        <div class="font-bold">Stopbits:</div>
                        <div>{{ uartConnectionOptions?.stopBits }}</div>
                      </div>
                      <div class="flex items-center gap-1">
                        <div class="font-bold">Databits:</div>
                        <div>{{ uartConnectionOptions?.dataBits }}</div>
                      </div>
                      <div class="flex items-center gap-1">
                        <div class="font-bold">Flow Kontrol:</div>
                        <div>{{ uartConnectionOptions?.flowControl }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ElTabPane>
          </ElTabs>
          <ElTabs class="w-full">
            <ElTabPane label="Client'a Özel Komut Gönder">
              <div>
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
                </div>
                <div class="mt-2">
                  <div class="flex justify-between items-center gap-2">
                    <div class="font-bold">Gelen Cevaplar</div>
                    <div class="flex items-center gap-2">
                      <ElButton :icon="Delete" @click.left="clearUartCommandResponses()" type="danger" size="small">
                        Temizle
                      </ElButton>
                    </div>
                  </div>
                  <div class="w-full h-[350px] overflow-y-auto border rounded space-y-1 p-1 mt-2">
                    <div v-for="command of uartCommandResponses" class="flex items-center gap-1 text-sm">
                      <div class="font-bold">{{ command.time }} - {{ command.type }}:</div>
                      <div>
                        {{ command.command }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ElTabPane>
          </ElTabs>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, computed, ref } from 'vue'
import type { Ref } from 'vue'
import {
  ElNotification,
  ElIcon,
  ElInput,
  ElButton,
  ElTooltip,
  ElTabs,
  ElTabPane,
  ElSelect,
  ElOption,
} from 'element-plus'
import { Loading, CircleCheck, CopyDocument, CircleClose, Refresh, Position, Delete } from '@element-plus/icons-vue'
import { isJSON, isObject, mqttTopics, connectionTypes, commandTypes } from '@remote-uart/shared'
import type { TCommandTypes, TConnectionTypes, TUartCommand, TSerialPortOptions } from '@remote-uart/shared'
import { useSerialPort } from '@/composables/SerialPort'
import { useMQTT } from '@/composables/MQTT'
import { useMqttClient } from '@/composables/MqttClient'
import SerialPort from '@/components/SerialPort.vue'

const serialPort = useSerialPort()
const mqtt = useMQTT()
const mqttClient = useMqttClient()

const serialPortSettingsDialog = ref(false)
const mqttConnectionStatus = ref(false)
const mqttConnectionType: Ref<TConnectionTypes> = ref(connectionTypes.notConnected)
const serialPortConnectionType: Ref<TConnectionTypes> = ref(connectionTypes.notConnected)
const uartCommandResponse: Ref<TUartCommand> = ref()
const uartCommandResponses: Ref<TUartCommand[]> = ref([])
const adminId = ref('')
const clientId = ref('')
const command = ref('')
const commandType: Ref<TCommandTypes> = ref(commandTypes.hex)
const uartConnectionStatus = ref(false)
const adminIdDisabled = ref(false)
const clientConnectionStatus = ref(false)
const uartConnectionOptions: Ref<TSerialPortOptions> = ref()
const adminIdLength = {
  min: 4,
  max: 36,
}
const clientIdLength = {
  max: 36,
}

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

const clientMqttConnection = computed(
  () => mqttConnectionType.value == connectionTypes.connected && clientConnectionStatus.value
)

function mqttConnectionValidation() {
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

function connectionClosedOperations() {
  mqttConnectionStatus.value = false
  adminIdDisabled.value = false
  clientConnectionStatus.value = false
  mqttConnectionType.value = connectionTypes.notConnected
  mqttClient.closeCheckClientMqttConnectionStatus()
}

function closeMqttConnection() {
  mqttConnectionType.value = connectionTypes.connectionClosing
  mqtt.closeConnection(true)
  connectionClosedOperations()
}

function createConnection() {
  if (!mqttConnectionValidation()) {
    return
  }

  localStorage.setItem(import.meta.env.VITE_CLIENT_ID, clientId.value)

  mqttConnectionType.value = connectionTypes.connecting
  const mqttConnection = mqtt.connect()

  mqttConnection.on('connect', () => {
    mqttConnectionStatus.value = true
    adminIdDisabled.value = true
    mqttConnectionType.value = connectionTypes.connected
    mqttClient.checkClientMqttConnectionStatus(clientId.value)
    mqttConnection.subscribe([
      mqttTopics.admin.mqttConnectionStatus(clientId.value),
      mqttTopics.admin.uartChannelOptions(clientId.value),
      mqttTopics.admin.uartStatus(clientId.value),
      mqttTopics.admin.uartCommand(clientId.value),
      mqttTopics.admin.deviceDebug(clientId.value),
    ])

    ElNotification({
      type: 'success',
      message: 'Server Bağlantısı Sağlandı',
    })

    manuelClientConnectionCheck()
    checkUARTOptions()
    checkUARTConnection()
  })

  mqttConnection.on('message', (_topic, _payload, packet) => {
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

      case mqttTopics.admin.deviceDebug(clientId.value):
        //cihaz debug
        return
    }
  })

  mqttConnection.on('close', () => {
    ElNotification({
      type: 'error',
      message: 'Server Bağlantısı Kapandı',
    })
    connectionClosedOperations()
  })

  mqttConnection.on('error', (error) => {
    mqttConnectionType.value = connectionTypes.connectionClosing
    ElNotification({
      type: 'error',
      message: error.message,
    })
    mqttConnection.end(true)
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

function setUartOptionsDialog(value: boolean) {
  serialPortSettingsDialog.value = value
}

function checkUARTOptions() {
  mqtt.getConnection().publish(mqttTopics.client.uartChannelOptions(clientId.value), '')
}

function checkAllClientUARTOptions() {
  checkUARTConnection()
  checkUARTOptions()
}

function clearUartCommandResponses() {
  uartCommandResponses.value = []
}

function copyClientId() {
  window.navigator.clipboard.writeText(clientId.value)
  ElNotification({
    type: 'success',
    message: 'ID Kopyalandı',
  })
}

onBeforeUnmount(() => {
  closeMqttConnection()
})
</script>
