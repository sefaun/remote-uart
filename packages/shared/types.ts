import type { ValueOf } from './global-types.js'
import { commandTypes, connectionTypes } from './enums.js'

export type TTheme = 'dark' | 'light'

export type TConnectionTypes = ValueOf<typeof connectionTypes>
export type TCommandTypes = ValueOf<typeof commandTypes>

export type TUartCommand = {
  command: string
  type: TCommandTypes
  time: string
}
