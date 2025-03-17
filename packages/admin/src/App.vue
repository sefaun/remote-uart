<template>
  <FileUpload />
</template>

<script setup lang="ts">
import type { TTheme } from '@remote-uart/shared'
import { useTheme } from '@/composables/Theme'
import FileUpload from '@/components/FileUpload.vue'

const theme = useTheme()
const themeType = localStorage.getItem(import.meta.env.VITE_THEME) as TTheme

theme.setTheme(themeType == theme.dark ? true : false)
</script>
