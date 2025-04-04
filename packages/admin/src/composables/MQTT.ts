import { ref } from 'vue'
import type { Ref } from 'vue'
import mqtt from 'mqtt'
import { useAdmin } from '@/composables/Admin'

const mqttConnection: Ref<mqtt.MqttClient> = ref()

export function useMQTT() {
  const admin = useAdmin()

  function connect() {
    closeConnection()
    mqttConnection.value = null
    mqttConnection.value = mqtt.connect(import.meta.env.VITE_MQTT_HOST, {
      clientId: admin.getAdminId(),
      reconnectPeriod: 0,
    })

    return getConnection()
  }

  function closeConnection() {
    if (mqttConnection.value) {
      mqttConnection.value.end(true)
      mqttConnection.value = null
    }
  }

  function getConnection() {
    return mqttConnection.value
  }

  function checkConnection() {
    return mqttConnection.value ? true : false
  }

  return {
    getConnection,
    checkConnection,
    connect,
    closeConnection,
  }
}
