import { ref } from 'vue'

const clientId = ref(window.crypto.randomUUID() as string)

export function useClient() {
  function getClientId() {
    return clientId.value
  }

  function setClientId(value: string) {
    clientId.value = value
  }

  return {
    clientId,
    getClientId,
    setClientId,
  }
}
