import { ref } from 'vue'
import type { Ref } from 'vue'
import mqtt from 'mqtt'

const mqttConnection: Ref<mqtt.MqttClient> = ref()

export function useMQTT() {
  const mqttConnectionSingleton: Ref<mqtt.MqttClient> = ref()

  function connectHost() {
    return mqtt.connect(import.meta.env.VITE_MQTT_HOST, {
      clientId: localStorage.getItem(import.meta.env.VITE_ADMIN_ID),
      reconnectPeriod: 0,
    })
  }

  function connect() {
    mqttConnection.value = connectHost()
  }

  function closeConnection(force: boolean) {
    mqttConnection.value.end(force)
  }

  function getConnection() {
    return mqttConnection.value
  }

  function connectSingleton() {
    mqttConnectionSingleton.value = connectHost()
  }

  function getConnectionSingleton() {
    return mqttConnection.value
  }

  return {
    getConnection,
    getConnectionSingleton,
    connect,
    connectSingleton,
    closeConnection,
  }
}
