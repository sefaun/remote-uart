import { ref } from 'vue'

const adminId = ref(window.crypto.randomUUID() as string)

export function useAdmin() {
  function getAdminId() {
    return adminId.value
  }

  function setAdminId(value: string) {
    adminId.value = value
  }

  return {
    getAdminId,
    setAdminId,
  }
}
