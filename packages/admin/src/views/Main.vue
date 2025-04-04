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
            :disabled="mqtt.checkConnection()"
            @click.left="createConnection()"
            type="success"
            size="small"
          >
            Bağlan
          </ElButton>
          <ElButton
            :loading="mqttConnectionType == connectionTypes.connectionClosing"
            :disabled="!mqtt.checkConnection()"
            @click.left="closeMqttConnection()"
            type="danger"
            size="small"
          >
            Bağlantı Kapat
          </ElButton>
        </div>
        <div class="flex justify-end items-center gap-2">
          <div class="flex justify-center items-center gap-2">
            <div class="font-bold">Admin ID:</div>
            <div>
              <div v-if="mqttConnectionType != connectionTypes.notConnected" class="text-sm">
                {{ admin.getAdminId() }}
              </div>
              <ElInput
                v-else
                v-model="admin.adminId.value"
                @input="adminIdChanged()"
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
                  <ElButton
                    :icon="Refresh"
                    :disabled="!(mqttConnectionType == connectionTypes.connected)"
                    :loading="mqttClient.getConnectionControl()"
                    @click.left="manuelClientConnectionCheck()"
                    type="info"
                    size="small"
                  >
                    Client Bağlantı Kontrolü
                  </ElButton>
                  <div class="flex items-center flex-wrap gap-2 mt-3">
                    <div class="w-full flex items-center gap-2">
                      <div class="text-sm">Client ID:</div>
                      <div>
                        <div
                          v-if="mqttConnectionType != connectionTypes.notConnected"
                          class="text-sm border rounded p-0.5"
                        >
                          {{ client.getClientId() }}
                        </div>
                        <ElInput
                          v-else
                          class="!min-w-[300px]"
                          v-model="client.clientId.value"
                          @input="clientIdChanged()"
                          :maxlength="clientIdLength.max"
                        />
                      </div>

                      <div v-if="mqttConnectionType == connectionTypes.connected" class="flex items-center gap-2">
                        <div v-if="mqttClient.getConnectionControl()">
                          <div class="flex items-center gap-2">
                            <div class="flex items-center">
                              <ElIcon color="orange">
                                <Loading />
                              </ElIcon>
                            </div>
                            <div class="text-sm">Bağlantı Kontrol Ediliyor</div>
                          </div>
                        </div>
                        <div v-else>
                          <div class="flex items-center gap-2">
                            <div class="text-sm">{{ clientMqttConnection ? 'Bağlı' : 'Bağlı Değil' }}</div>
                            <div class="flex items-center">
                              <ElIcon :color="clientMqttConnection ? 'green' : 'red'">
                                <component :is="clientMqttConnection ? CircleCheck : CircleClose" />
                              </ElIcon>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="w-full gap-3 mt-8">
                <div>
                  <ElButton
                    :disabled="!clientMqttConnection"
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
                      <div class="text-sm">{{ serialPortConnectionStatus ? 'Bağlı' : 'Bağlı Değil' }}</div>
                      <div class="flex items-center">
                        <ElIcon :color="serialPortConnectionStatus ? 'green' : 'red'">
                          <component :is="serialPortConnectionStatus ? CircleCheck : CircleClose" />
                        </ElIcon>
                      </div>
                    </div>
                  </div>
                  <div class="space-y-1 mt-2">
                    <div class="font-bold">Bağlantı Bilgileri:</div>
                    <div v-if="isObject(clientSerialPortConnectionOptions)" class="text-sm">
                      <div class="flex items-center gap-1">
                        <div class="font-bold">COM:</div>
                        <div>{{ clientSerialPortConnectionOptions?.path }}</div>
                      </div>
                      <div class="flex items-center gap-1">
                        <div class="font-bold">Baudrate:</div>
                        <div>{{ clientSerialPortConnectionOptions?.baudRate }}</div>
                      </div>
                      <div class="flex items-center gap-1">
                        <div class="font-bold">Parity:</div>
                        <div>{{ clientSerialPortConnectionOptions?.parity }}</div>
                      </div>
                      <div class="flex items-center gap-1">
                        <div class="font-bold">Stopbits:</div>
                        <div>{{ clientSerialPortConnectionOptions?.stopBits }}</div>
                      </div>
                      <div class="flex items-center gap-1">
                        <div class="font-bold">Databits:</div>
                        <div>{{ clientSerialPortConnectionOptions?.dataBits }}</div>
                      </div>
                      <div class="flex items-center gap-1">
                        <div class="font-bold">Flow Kontrol:</div>
                        <div>{{ clientSerialPortConnectionOptions?.flowControl }}</div>
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
import { Loading, CircleCheck, CopyDocument, CircleClose, Refresh, Position } from '@element-plus/icons-vue'
import { isJSON, isObject, mqttTopics, connectionTypes, commandTypes, debounce } from '@remote-uart/shared'
import type { TCommandTypes, TConnectionTypes, TUartCommand, TSerialPortOptions } from '@remote-uart/shared'
import { useAdmin } from '@/composables/Admin'
import { useClient } from '@/composables/Client'
import { useSerialPort } from '@/composables/SerialPort'
import { useMQTT } from '@/composables/MQTT'
import { useMqttClient } from '@/composables/MqttClient'
import SerialPort from '@/components/SerialPort.vue'

const admin = useAdmin()
const client = useClient()
const serialPort = useSerialPort()
const mqtt = useMQTT()
const mqttClient = useMqttClient()

const mqttConnectionType: Ref<TConnectionTypes> = ref(connectionTypes.notConnected)
const command = ref('')
const commandType: Ref<TCommandTypes> = ref(commandTypes.hex)
const serialPortConnectionStatus = ref(false)
const adminIdDisabled = ref(false)
const clientMqttConnectionStatus = ref(false)
const clientSerialPortConnectionOptions: Ref<TSerialPortOptions> = ref()
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
  () => mqttConnectionType.value == connectionTypes.connected && clientMqttConnectionStatus.value
)

function mqttConnectionValidation() {
  if (admin.getAdminId().length < adminIdLength.min || admin.getAdminId().length > adminIdLength.max) {
    ElNotification({
      type: 'warning',
      message: 'Admin ID en az 4 en fazla 36 karakter olabilir',
    })
    return false
  }

  if (client.getClientId().length != clientIdLength.max) {
    ElNotification({
      type: 'warning',
      message: 'Client ID 36 karakter olmalıdır',
    })
    return false
  }

  if (admin.getAdminId() == client.getClientId()) {
    ElNotification({
      type: 'warning',
      message: 'Admin ID ve Client ID aynı olamaz',
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
    mqttTopics.client.uartCommand(client.getClientId()),
    JSON.stringify({
      type: commandType.value,
      command: command.value,
      time: new Date().toLocaleString(),
    } as TUartCommand)
  )
}

function connectionClosedOperations() {
  adminIdDisabled.value = false
  clientMqttConnectionStatus.value = false
  mqttConnectionType.value = connectionTypes.notConnected
  mqttClient.closeCheckClientMqttConnectionStatus()
}

function closeMqttConnection() {
  mqttConnectionType.value = connectionTypes.connectionClosing
  mqtt.closeConnection()
  connectionClosedOperations()
}

function createConnection() {
  if (!mqttConnectionValidation()) {
    return
  }

  localStorage.setItem(import.meta.env.VITE_CLIENT_ID, client.getClientId())

  mqttConnectionType.value = connectionTypes.connecting
  const mqttConnection = mqtt.connect()

  mqttConnection.on('connect', () => {
    adminIdDisabled.value = true
    mqttConnectionType.value = connectionTypes.connected
    mqttClient.checkClientMqttConnectionStatus(client.getClientId())
    mqttConnection.subscribe([
      mqttTopics.admin.mqttConnectionStatus(client.getClientId()),
      mqttTopics.admin.uartChannelOptions(client.getClientId()),
      mqttTopics.admin.uartStatus(client.getClientId()),
      mqttTopics.admin.uartCommand(client.getClientId()),
      mqttTopics.admin.deviceDebug(client.getClientId()),
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
      case mqttTopics.admin.mqttConnectionStatus(client.getClientId()):
        mqttClient.setConnectionControl(false)
        clientMqttConnectionStatus.value = true
        return

      case mqttTopics.admin.uartChannelOptions(client.getClientId()):
        clientSerialPortConnectionOptions.value = isJSON(packet.payload.toString())
          ? JSON.parse(packet.payload.toString())
          : {}
        return

      case mqttTopics.admin.uartStatus(client.getClientId()):
        serialPortConnectionStatus.value = packet.payload.toString() == 'true'
        return

      case mqttTopics.admin.deviceDebug(client.getClientId()):
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
  mqtt.getConnection().publish(mqttTopics.client.mqttConnectionStatus(client.getClientId()), 'ping')
}

function checkUARTConnection() {
  mqtt.getConnection().publish(mqttTopics.client.uartStatus(client.getClientId()), '')
}

function checkUARTOptions() {
  mqtt.getConnection().publish(mqttTopics.client.uartChannelOptions(client.getClientId()), '')
}

function checkAllClientUARTOptions() {
  checkUARTConnection()
  checkUARTOptions()
}

function adminIdChanged() {
  localStorage.setItem(import.meta.env.VITE_ADMIN_ID, admin.getAdminId())
}

function clientIdChanged() {
  localStorage.setItem(import.meta.env.VITE_CLIENT_ID, client.getClientId())
}

function copyClientId() {
  window.navigator.clipboard.writeText(client.getClientId())
  ElNotification({
    type: 'success',
    message: 'ID Kopyalandı',
  })
}

onBeforeUnmount(() => {
  closeMqttConnection()
})
</script>
