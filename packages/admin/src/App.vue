<template>
  <router-view />
  <div class="fixed bottom-4 right-4">
    <Theme />
  </div>
</template>

<script setup lang="ts">
import type { TTheme } from '@remote-uart/shared'
import { useTheme } from '@/composables/Theme'
import Theme from '@/components/Theme.vue'

const theme = useTheme()

const themeType = localStorage.getItem(import.meta.env.VITE_THEME) as TTheme
theme.setTheme(themeType == theme.dark ? true : false)
</script>
