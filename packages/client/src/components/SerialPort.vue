<template>
  <div class="w-full">
    <div class="flex justify-between">
      <div>
        <div class="flex items-center gap-2">
          <div>UART Bağlantı Durumu:</div>
          <div>{{ serialPortConnectionTypeIcon.name }}</div>
          <div class="flex items-center">
            <ElIcon :color="serialPortConnectionTypeIcon.color">
              <component :is="serialPortConnectionTypeIcon.is" />
            </ElIcon>
          </div>
        </div>
        <ElButton
          :disabled="serialPort.getSerialConnectionStatus()"
          :loading="serialPortConnectionType == connectionTypes.connecting"
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
      </div>
      <div>
        <SerialPortSettings @change="closeSerialPortSettingsDialog()"></SerialPortSettings>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Ref } from 'vue'
import { ElNotification, ElButton, ElIcon } from 'element-plus'
import { CircleCheck, CircleClose, Loading } from '@element-plus/icons-vue'
import { debounce, connectionTypes, mqttTopics } from '@remote-uart/shared'
import type { TConnectionTypes } from '@remote-uart/shared'
import { useClient } from '@/composables/Client'
import { useMQTT } from '@/composables/MQTT'
import { useSerialPort } from '@/composables/SerialPort'
import SerialPortSettings from '@/components/SerialPortSettings.vue'
const { InterByteTimeoutParser } = window.require(
  '@serialport/parser-inter-byte-timeout'
) as typeof import('@serialport/parser-inter-byte-timeout')

const client = useClient()
const mqtt = useMQTT()
const serialPort = useSerialPort()

const serialPortConnectionType: Ref<TConnectionTypes> = ref(connectionTypes.notConnected)

const serialPortConnectionTypeIcon = computed(() => {
  switch (serialPortConnectionType.value) {
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

function createSerialConnection() {
  if (!serialConnectionValidation()) {
    return
  }

  serialPortConnectionType.value = connectionTypes.connecting

  const serialPortConnection = serialPort.createSerialPort() as any

  // Bağlantı sağlandığında burası çalışır
  serialPortConnection.on('open', () => {
    serialPort.setSerialConnectionStatus(true)
    serialPortConnectionType.value = connectionTypes.connected

    serialPortConnection.pipe(new InterByteTimeoutParser({ interval: 10 })).on('data', (data: Buffer) => {
      // serialPortConnection.on('data', (data: Buffer) => {
      if (mqtt.checkConnection()) {
        mqtt.getConnection().publish(mqttTopics.admin.deviceDebug(client.getClientId()), data)
      } else {
        debounce(() => {
          ElNotification({
            type: 'error',
            title: 'Server Bağlantı Hatası',
            message: 'Server bağlantısı olmadığı için UART verisi gönderilemedi',
          })
        }, 3000)()
      }
    })
  })

  // karşı taraftan comport kapandığında burası çalışır.
  serialPortConnection.on('close', () => {
    serialPort.setSerialConnectionStatus(false)
    closeSerialConnection()
    ElNotification({
      type: 'error',
      message: 'Serial Port Kapatıldı',
    })
  })
  // Bağlantı sağlanamazsa burası çalışır
  serialPortConnection.on('error', (_err: Error) => {
    serialPort.setSerialConnectionStatus(false)
    closeSerialConnection()
    ElNotification({
      type: 'error',
      message: 'Serial Port Bağlantısı Kurulamadı',
    })
  })
}

function closeSerialConnection() {
  serialPortConnectionType.value = connectionTypes.connectionClosing
  serialPort.closeSerialPort()
  serialPortConnectionType.value = connectionTypes.notConnected
}

function closeSerialPortSettingsDialog() {
  if (serialPort.checkConnection()) {
    closeSerialConnection()
  }

  if (mqtt.checkConnection()) {
    mqtt
      .getConnection()
      .publish(mqttTopics.admin.uartChannelOptions(client.getClientId()), JSON.stringify(serialPort.getPortSettings()))
  }
}
</script>
