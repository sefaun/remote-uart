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
              <ElInput v-else class="!min-w-[300px]" v-model="adminId" :minlength="2" :maxlength="36" />
            </div>
          </div>
          <Theme />
        </div>
      </div>
      <div class="w-full flex justify-center items-center">
        <div class="w-[75%] h-full space-y-7 mt-20">
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
import { ElNotification, ElIcon, ElUpload, ElInput, ElButton } from 'element-plus'
import type { UploadFile, UploadFiles } from 'element-plus'
import { UploadFilled, Loading, CircleCheck, Connection } from '@element-plus/icons-vue'
import { useMQTT } from '@/composables/MQTT'
import { connectionTypes } from '@/enums'
import type { TConnectionTypes } from '@/types'
import Theme from '@/components/Theme.vue'

const mqtt = useMQTT()

const incomingMessage = ref()
const connectionStatus = ref(false)
const connectionType: Ref<TConnectionTypes> = ref(connectionTypes.connect)
const adminId = ref('')
const selectedFile = ref([])
const adminIdDisabled = ref(false)
const adminIdLength = {
  min: 4,
  max: 36,
}
let uploadFileContent: Uint8Array = null

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

function getAdminId() {
  const localData = localStorage.getItem(import.meta.env.VITE_ADMIN_ID)

  if (!localData) {
    adminId.value = window.crypto.randomUUID()
    localStorage.setItem(import.meta.env.VITE_ADMIN_ID, adminId.value)
  } else {
    adminId.value = localData
  }
}

function connectionValidation() {
  if (adminId.value.length < adminIdLength.min || adminId.value.length > adminIdLength.max) {
    ElNotification({
      type: 'warning',
      message: 'Admin ID en az 4 en fazla 36 karakter olabilir',
    })
    return false
  }

  return true
}

async function handleChange(uploadFile: UploadFile, _uploadFiles: UploadFiles) {
  uploadFileContent = await uploadFile.raw.bytes()
}

function sendFile() {
  mqtt.getConnection().publish(adminId.value, uploadFileContent as Uint8Array as Buffer)
  ElNotification({
    type: 'success',
    message: 'Dosya Gönderildi',
  })
}

function connectionClosedOperations() {
  connectionStatus.value = false
  adminIdDisabled.value = false
  connectionType.value = connectionTypes.connect
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

  mqtt.connect()
  const connection = mqtt.getConnection()

  connection.on('connect', () => {
    connectionStatus.value = true
    adminIdDisabled.value = true
    connectionType.value = connectionTypes.connected
    ElNotification({
      type: 'success',
      message: 'Bağlantı Sağlandı',
    })
  })

  connection.on('message', (_topic, _payload, packet) => {
    incomingMessage.value = JSON.parse(packet.payload as string)
  })

  connection.on('offline', () => {
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

onMounted(() => {
  getAdminId()
})

onBeforeUnmount(() => {
  mqtt.closeConnection(true)
})
</script>
