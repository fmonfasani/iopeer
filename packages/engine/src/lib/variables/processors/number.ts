import { isNil } from '@IOpeer/shared'
import { ProcessorFn } from './types'

export const numberProcessor: ProcessorFn = (_property, value) => {
    if (isNil(value)) {
        return value
    }
    if (value === '') {
        return undefined
    }
    return Number(value)
}
