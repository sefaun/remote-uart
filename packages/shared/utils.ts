export function cloneDeep<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

export function isJSON(value: any): boolean {
  try {
    JSON.parse(value)
    return true
  } catch (error) {
    return false
  }
}
