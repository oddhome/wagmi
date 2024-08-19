import { getClient } from '../../client'
import { watchBlockNumber } from '../network-status/watchBlockNumber'
import {
  ReadContractConfig,
  ReadContractResult,
  readContract,
} from './readContract'

export type WatchReadContractConfig = ReadContractConfig & {
  listenToBlock?: boolean
}
export type WatchReadContractResult = (result: ReadContractResult) => void

export function watchReadContract(
  config: WatchReadContractConfig,
  callback: WatchReadContractResult,
) {
  const client = getClient()

  const handleChange = async () => callback(await readContract(config))

  const unwatch = config.listenToBlock
    ? watchBlockNumber({ listen: true }, handleChange)
    : undefined
  const unsubscribe = client.subscribe(({ provider }) => provider, handleChange)

  return () => {
    unsubscribe()
    unwatch?.()
  }
}
