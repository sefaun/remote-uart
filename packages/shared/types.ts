import type { ValueOf } from './global-types.js'
import { connectionTypes } from './enums.js'

export type TTheme = 'dark' | 'light'

export type TConnectionTypes = ValueOf<typeof connectionTypes>
