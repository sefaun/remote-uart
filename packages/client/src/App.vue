<template>
  <router-view />
  <div class="fixed bottom-4 left-4">
    <Theme />
  </div>
</template>

<script setup lang="ts">
import { onBeforeMount, onMounted } from 'vue'
import type { TTheme } from '@remote-uart/shared'
import { useClient } from '@/composables/Client'
import { useTheme } from '@/composables/Theme'
import { useSerialPort } from '@/composables/SerialPort'
import Theme from '@/components/Theme.vue'

const client = useClient()
const theme = useTheme()
const serialPort = useSerialPort()

const localStorageClientIdKey: string = import.meta.env.VITE_CLIENT_ID

function themeOperations() {
  const themeType = localStorage.getItem(import.meta.env.VITE_THEME) as TTheme
  theme.setTheme(themeType == theme.dark ? true : false)
}

function clientOperations() {
  const localData = localStorage.getItem(localStorageClientIdKey)

  if (!localData) {
    client.setClientId(window.crypto.randomUUID())
    localStorage.setItem(localStorageClientIdKey, client.getClientId())
  } else {
    client.setClientId(localData)
  }
}

onBeforeMount(() => {
  themeOperations()
  clientOperations()
})

onMounted(async () => {
  await serialPort.getActivePorts()
})
</script>
