<template>
  <router-view />
  <div class="fixed bottom-4 right-4">
    <Theme />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import type { TTheme } from '@remote-uart/shared'
import { useTheme } from '@/composables/Theme'
import { useSerialPort } from '@/composables/SerialPort'
import Theme from '@/components/Theme.vue'

const theme = useTheme()
const serialPort = useSerialPort()

const themeType = localStorage.getItem(import.meta.env.VITE_THEME) as TTheme
theme.setTheme(themeType == theme.dark ? true : false)

onMounted(async () => {
  await serialPort.getActivePorts()
})
</script>
