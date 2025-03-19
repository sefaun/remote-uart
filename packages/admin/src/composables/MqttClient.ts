import { ref } from 'vue'
import type { Ref } from 'vue'
import { mqttTopics } from '@remote-uart/shared'
import { useMQTT } from '@/composables/MQTT'

const connectionCheckInterval = ref<NodeJS.Timeout>()
const connectionControl: Ref<boolean> = ref(false)

export function useMqttClient() {
  const connection = useMQTT()

  function getConnectionControl() {
    return connectionControl.value
  }

  function setConnectionControl(value: boolean) {
    connectionControl.value = value
  }

  function checkClientMqttConnectionStatus(clientId: string, second: number = 10) {
    if (connectionCheckInterval.value) {
      closeCheckClientMqttConnectionStatus()
    }

    connectionCheckInterval.value = setInterval(() => {
      setConnectionControl(true)
      connection.getConnection().publish(mqttTopics.client.mqttConnectionStatus(clientId), 'ping')
    }, second * 1000)
  }

  function closeCheckClientMqttConnectionStatus() {
    clearInterval(connectionCheckInterval.value)
    connectionCheckInterval.value = null
  }

  return {
    getConnectionControl,
    setConnectionControl,
    checkClientMqttConnectionStatus,
    closeCheckClientMqttConnectionStatus,
  }
}
