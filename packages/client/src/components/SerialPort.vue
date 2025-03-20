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
            <ElSelect v-model="payload.path" placeholder="Port" size="small" class="w-full">
              <ElOption v-for="port of ports" :key="port.path" :label="port.path" :value="port.path" />
            </ElSelect>
          </td>
        </tr>
        <tr>
          <td class="text-right p-1">Baud Rate:</td>
          <td class="w-[150px] p-1">
            <ElSelect v-model="payload.baudRate" size="small" class="w-full">
              <ElOption v-for="rate of baudRate" :key="rate" :value="rate">
                {{ rate }}
              </ElOption>
            </ElSelect>
          </td>
        </tr>
        <tr>
          <td class="text-right p-1">Data bits:</td>
          <td class="w-[150px] p-1">
            <ElSelect v-model="payload.dataBits" size="small" class="w-full">
              <ElOption v-for="dBit of dataBits" :key="dBit" :value="dBit">
                {{ dBit }}
              </ElOption>
            </ElSelect>
          </td>
        </tr>
        <tr>
          <td class="text-right p-1">Stop bits:</td>
          <td class="w-[150px] p-1">
            <ElSelect v-model="payload.stopBits" size="small" class="w-full">
              <ElOption v-for="sBit of stopBits" :key="sBit" :value="sBit">
                {{ sBit }}
              </ElOption>
            </ElSelect>
          </td>
        </tr>
        <tr>
          <td class="text-right p-1">Parity:</td>
          <td class="w-[150px] p-1">
            <ElSelect v-model="payload.parity" size="small" class="w-full">
              <ElOption v-for="parit of parity" :key="parit" :value="parit">
                {{ parit }}
              </ElOption>
            </ElSelect>
          </td>
        </tr>
        <tr>
          <td class="text-right p-1">Flow Control:</td>
          <td class="w-[150px] p-1">
            <ElSelect v-model="payload.flowControl" size="small" class="w-full">
              <ElOption v-for="flow of flowControl" :key="flow" :value="flow">
                {{ flow }}
              </ElOption>
            </ElSelect>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <div class="flex justify-center items-center">
    <ElButton :icon="Check" @click.left.stop="saveSerialPortOptions()" type="primary" class="w-full mt-5">
      Kaydet
    </ElButton>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { Ref } from 'vue'
import { ElButton, ElSelect, ElOption } from 'element-plus'
import { Check, Refresh } from '@element-plus/icons-vue'
import { cloneDeep } from '@remote-uart/shared'
import { useSerialPort } from '@/composables/SerialPort'
import { baudRate, dataBits, flowControl, parity, stopBits } from '@/enums'
import type { TActiveSerialPortsPayload } from '@/types'

const emit = defineEmits<{
  (e: 'close'): void
}>()

const serialPort = useSerialPort()

const ports: Ref<TActiveSerialPortsPayload[]> = ref()
const payload = ref(cloneDeep(serialPort.getPortSettings()))

async function getActivePorts() {
  ports.value = await serialPort.getActivePorts()
}

function saveSerialPortOptions() {
  serialPort.setPortSettings(cloneDeep(payload.value))
  close()
}

function close() {
  emit('close')
}

onMounted(() => {
  getActivePorts()
})
</script>
