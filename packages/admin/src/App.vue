<template>
  <router-view />
  <div class="fixed bottom-4 right-4">
    <Theme />
  </div>
</template>

<script setup lang="ts">
import { onBeforeMount, onMounted } from 'vue'
import type { TTheme } from '@remote-uart/shared'
import { useAdmin } from '@/composables/Admin'
import { useClient } from '@/composables/Client'
import { useTheme } from '@/composables/Theme'
import { useSerialPort } from '@/composables/SerialPort'
import Theme from '@/components/Theme.vue'

const admin = useAdmin()
const client = useClient()
const theme = useTheme()
const serialPort = useSerialPort()

const localStorageAdminIdKey: string = import.meta.env.VITE_ADMIN_ID
const localStorageClientIdKey: string = import.meta.env.VITE_CLIENT_ID

function themeOperations() {
  const themeType = localStorage.getItem(import.meta.env.VITE_THEME) as TTheme
  theme.setTheme(themeType == theme.dark ? true : false)
}

function adminOperations() {
  const localAdminData = localStorage.getItem(localStorageAdminIdKey)

  if (!localAdminData) {
    admin.setAdminId(window.crypto.randomUUID())
    localStorage.setItem(localStorageAdminIdKey, admin.getAdminId())
  } else {
    admin.setAdminId(localAdminData)
  }
}

function clientOperations() {
  const localClientData = localStorage.getItem(localStorageClientIdKey)

  if (localClientData) {
    client.setClientId(localClientData)
  }
}

onBeforeMount(() => {
  themeOperations()
  adminOperations()
  clientOperations()
})

onMounted(async () => {
  await serialPort.getActivePorts()
})
</script>
