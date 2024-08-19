import { describe, expect, it } from 'vitest'

import {
  actConnect,
  getRandomTokenId,
  mlootContractConfig,
  renderHook,
  wagmiContractConfig,
} from '../../../test'
import { useConnect } from '../accounts'
import {
  UsePrepareContractWriteArgs,
  UsePrepareContractWriteConfig,
  usePrepareContractWrite,
} from './usePrepareContractWrite'

function usePrepareContractWriteWithConnect(
  config: UsePrepareContractWriteArgs & UsePrepareContractWriteConfig,
) {
  const { ...prepareContractTransaction } = usePrepareContractWrite(config)
  return {
    connect: useConnect(),
    prepareContractTransaction,
  }
}

describe('usePrepareContractWrite', () => {
  it('mounts', async () => {
    const tokenId = getRandomTokenId()
    const { result } = renderHook(() =>
      usePrepareContractWriteWithConnect({
        ...wagmiContractConfig,
        functionName: 'mint',
        args: [tokenId],
      }),
    )

    const { config, ...rest } = result.current.prepareContractTransaction
    expect(config).toBeDefined()
    expect(rest).toMatchInlineSnapshot(`
      {
        "data": undefined,
        "error": null,
        "fetchStatus": "idle",
        "internal": {
          "dataUpdatedAt": 0,
          "errorUpdatedAt": 0,
          "failureCount": 0,
          "isFetchedAfterMount": false,
          "isLoadingError": false,
          "isPaused": false,
          "isPlaceholderData": false,
          "isPreviousData": false,
          "isRefetchError": false,
          "isStale": true,
          "remove": [Function],
        },
        "isError": false,
        "isFetched": false,
        "isFetching": false,
        "isIdle": true,
        "isLoading": false,
        "isRefetching": false,
        "isSuccess": false,
        "refetch": [Function],
        "status": "idle",
      }
    `)
  })

  it('connect', async () => {
    const tokenId = getRandomTokenId()
    const utils = renderHook(() =>
      usePrepareContractWriteWithConnect({
        ...wagmiContractConfig,
        functionName: 'mint',
        args: [tokenId],
      }),
    )
    const { result, waitFor } = utils

    await actConnect({ utils })

    await waitFor(() =>
      expect(result.current.prepareContractTransaction.isSuccess).toBeTruthy(),
    )

    const {
      config,
      data: res,
      ...rest
    } = result.current.prepareContractTransaction
    const { data, gasLimit, ...restRequest } = config?.request || {}
    expect(res).toBeDefined()
    expect(config).toBeDefined()
    expect(gasLimit).toBeDefined()
    expect(data).toBeDefined()
    expect(restRequest).toMatchInlineSnapshot(`
      {
        "from": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        "to": "0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2",
      }
    `)
    expect(rest).toMatchInlineSnapshot(`
      {
        "error": null,
        "fetchStatus": "idle",
        "internal": {
          "dataUpdatedAt": 1643673600000,
          "errorUpdatedAt": 0,
          "failureCount": 0,
          "isFetchedAfterMount": true,
          "isLoadingError": false,
          "isPaused": false,
          "isPlaceholderData": false,
          "isPreviousData": false,
          "isRefetchError": false,
          "isStale": true,
          "remove": [Function],
        },
        "isError": false,
        "isFetched": true,
        "isFetching": false,
        "isIdle": false,
        "isLoading": false,
        "isRefetching": false,
        "isSuccess": true,
        "refetch": [Function],
        "status": "success",
      }
    `)
  })

  describe('errors', () => {
    it('contract method error', async () => {
      const utils = renderHook(() =>
        usePrepareContractWriteWithConnect({
          ...mlootContractConfig,
          functionName: 'claim',
          args: 1,
        }),
      )
      const { result, waitFor } = utils

      await actConnect({ utils })

      await waitFor(() =>
        expect(result.current.prepareContractTransaction.isError).toBeTruthy(),
      )

      const { config, data, ...rest } =
        result.current.prepareContractTransaction
      expect(config).toBeDefined()
      expect(data).toBeUndefined()
      expect(rest).toMatchInlineSnapshot(`
        {
          "error": [Error: cannot estimate gas; transaction may fail or may require manual gas limit [ See: https://links.ethers.org/v5-errors-UNPREDICTABLE_GAS_LIMIT ] (reason="execution reverted: Token ID invalid", method="estimateGas", transaction={"from":"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266","to":"0x1dfe7Ca09e99d10835Bf73044a23B73Fc20623DF","data":"0x379607f50000000000000000000000000000000000000000000000000000000000000001","accessList":null}, error={"reason":"processing response error","code":"SERVER_ERROR","body":"{\\"jsonrpc\\":\\"2.0\\",\\"id\\":42,\\"error\\":{\\"code\\":3,\\"message\\":\\"execution reverted: Token ID invalid\\",\\"data\\":\\"0x08c379a000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000010546f6b656e20494420696e76616c696400000000000000000000000000000000\\"}}","error":{"code":3,"data":"0x08c379a000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000010546f6b656e20494420696e76616c696400000000000000000000000000000000"},"requestBody":"{\\"method\\":\\"eth_estimateGas\\",\\"params\\":[{\\"from\\":\\"0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266\\",\\"to\\":\\"0x1dfe7ca09e99d10835bf73044a23b73fc20623df\\",\\"data\\":\\"0x379607f50000000000000000000000000000000000000000000000000000000000000001\\"}],\\"id\\":42,\\"jsonrpc\\":\\"2.0\\"}","requestMethod":"POST","url":"http://127.0.0.1:8545"}, code=UNPREDICTABLE_GAS_LIMIT, version=providers/5.7.0)],
          "fetchStatus": "idle",
          "internal": {
            "dataUpdatedAt": 0,
            "errorUpdatedAt": 1643673600000,
            "failureCount": 1,
            "isFetchedAfterMount": true,
            "isLoadingError": true,
            "isPaused": false,
            "isPlaceholderData": false,
            "isPreviousData": false,
            "isRefetchError": false,
            "isStale": true,
            "remove": [Function],
          },
          "isError": true,
          "isFetched": true,
          "isFetching": false,
          "isIdle": false,
          "isLoading": false,
          "isRefetching": false,
          "isSuccess": false,
          "refetch": [Function],
          "status": "error",
        }
      `)
    })

    it('contract function not found', async () => {
      const utils = renderHook(() =>
        usePrepareContractWriteWithConnect({
          ...wagmiContractConfig,
          functionName: 'wagmi',
        }),
      )
      const { result, waitFor } = utils

      await actConnect({ utils })

      await waitFor(() =>
        expect(result.current.prepareContractTransaction.isError).toBeTruthy(),
      )

      const { config, data, ...rest } =
        result.current.prepareContractTransaction
      expect(config).toBeDefined()
      expect(data).toBeUndefined()
      expect(rest).toMatchInlineSnapshot(`
        {
          "error": [ContractMethodDoesNotExistError: Function "wagmi" on contract "0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2" does not exist.

        Etherscan: https://etherscan.io/address/0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2#readContract],
          "fetchStatus": "idle",
          "internal": {
            "dataUpdatedAt": 0,
            "errorUpdatedAt": 1643673600000,
            "failureCount": 1,
            "isFetchedAfterMount": true,
            "isLoadingError": true,
            "isPaused": false,
            "isPlaceholderData": false,
            "isPreviousData": false,
            "isRefetchError": false,
            "isStale": true,
            "remove": [Function],
          },
          "isError": true,
          "isFetched": true,
          "isFetching": false,
          "isIdle": false,
          "isLoading": false,
          "isRefetching": false,
          "isSuccess": false,
          "refetch": [Function],
          "status": "error",
        }
      `)
    })
  })
})
