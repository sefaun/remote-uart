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

export function isObject(value: any): boolean {
  return toString.call(value) == '[object Object]'
}

//'buffer' -> 627566666572
export function stringToHex(value: string): string {
  return Buffer.from(value).toString('hex')
}

//627566666572 -> <Buffer 62 75 66 66 65 72>
export function stringHexToBuffer(value: string): Buffer {
  return Buffer.from(value, 'hex')
}

//<Buffer 62 75 66 66 65 72> -> buffer
export function bufferToString(value: Buffer): string {
  return value.toString()
}
