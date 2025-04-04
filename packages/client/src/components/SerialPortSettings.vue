<template>
  <div class="flex justify-end items-center mb-3">
    <ElButton :icon="Refresh" @click.left="getActivePorts()" size="small" type="info">PORT'ları Yenile</ElButton>
  </div>
  <div class="flex items-center">
    <table>
      <tbody>
        <tr>
          <td class="text-right p-1">Port:</td>
          <td class="w-[150px] p-1">
            <ElSelect
              v-model="payload.path"
              @change="changedSerialPortSettings"
              placeholder="Port"
              size="small"
              class="w-full"
            >
              <ElOption v-for="port of ports" :key="port.path" :label="port.path" :value="port.path" />
            </ElSelect>
          </td>
        </tr>
        <tr>
          <td class="text-right p-1">Baud Rate:</td>
          <td class="w-[150px] p-1">
            <ElSelect v-model="payload.baudRate" @change="changedSerialPortSettings" size="small" class="w-full">
              <ElOption v-for="rate of baudRate" :key="rate" :value="rate">
                {{ rate }}
              </ElOption>
            </ElSelect>
          </td>
        </tr>
        <tr>
          <td class="text-right p-1">Data bits:</td>
          <td class="w-[150px] p-1">
            <ElSelect v-model="payload.dataBits" @change="changedSerialPortSettings" size="small" class="w-full">
              <ElOption v-for="dBit of dataBits" :key="dBit" :value="dBit">
                {{ dBit }}
              </ElOption>
            </ElSelect>
          </td>
        </tr>
        <tr>
          <td class="text-right p-1">Stop bits:</td>
          <td class="w-[150px] p-1">
            <ElSelect v-model="payload.stopBits" @change="changedSerialPortSettings" size="small" class="w-full">
              <ElOption v-for="sBit of stopBits" :key="sBit" :value="sBit">
                {{ sBit }}
              </ElOption>
            </ElSelect>
          </td>
        </tr>
        <tr>
          <td class="text-right p-1">Parity:</td>
          <td class="w-[150px] p-1">
            <ElSelect v-model="payload.parity" @change="changedSerialPortSettings" size="small" class="w-full">
              <ElOption v-for="parit of parity" :key="parit" :value="parit">
                {{ parit }}
              </ElOption>
            </ElSelect>
          </td>
        </tr>
        <tr>
          <td class="text-right p-1">Flow Control:</td>
          <td class="w-[150px] p-1">
            <ElSelect v-model="payload.flowControl" @change="changedSerialPortSettings" size="small" class="w-full">
              <ElOption v-for="flow of flowControl" :key="flow" :value="flow">
                {{ flow }}
              </ElOption>
            </ElSelect>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { Ref } from 'vue'
import { ElButton, ElSelect, ElOption } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { cloneDeep, baudRate, dataBits, flowControl, parity, stopBits } from '@remote-uart/shared'
import type { TActiveSerialPortsPayload } from '@remote-uart/shared'
import { useSerialPort } from '@/composables/SerialPort'

const emit = defineEmits<{
  (e: 'change'): void
}>()

const serialPort = useSerialPort()

const ports: Ref<TActiveSerialPortsPayload[]> = ref()
const payload = ref(cloneDeep(serialPort.getPortSettings()))

async function getActivePorts() {
  ports.value = await serialPort.getActivePorts()
}

function changedSerialPortSettings() {
  serialPort.setPortSettings(cloneDeep(payload.value))
  change()
}

function change() {
  emit('change')
}

onMounted(() => {
  getActivePorts()
})
</script>
