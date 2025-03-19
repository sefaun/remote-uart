import { ref } from 'vue'
import type { Ref } from 'vue'
import mqtt from 'mqtt'

const mqttConnection: Ref<mqtt.MqttClient> = ref()

export function useMQTT() {
  function connect() {
    mqttConnection.value = mqtt.connect(import.meta.env.VITE_MQTT_HOST, {
      clientId: localStorage.getItem(import.meta.env.VITE_ADMIN_ID),
      reconnectPeriod: 0,
    })

    return getConnection()
  }

  function closeConnection(force: boolean) {
    mqttConnection.value.end(force)
  }

  function getConnection() {
    return mqttConnection.value
  }

  return {
    getConnection,
    connect,
    closeConnection,
  }
}
