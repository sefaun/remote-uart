import { ref } from 'vue'

const serialPortSettingsDialog = ref(false)

export function useSerialPortSettingsDialog() {
  function getSerialPortSettingsDialog() {
    return serialPortSettingsDialog.value
  }

  function setSerialPortSettingsDialog(value: boolean) {
    serialPortSettingsDialog.value = value
  }

  return {
    serialPortSettingsDialog,
    getSerialPortSettingsDialog,
    setSerialPortSettingsDialog,
  }
}
