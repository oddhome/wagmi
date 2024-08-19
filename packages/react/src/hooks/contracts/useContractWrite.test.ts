import { describe, expect, it } from 'vitest'

import {
  act,
  actConnect,
  getCrowdfundArgs,
  getRandomTokenId,
  getSigners,
  mirrorCrowdfundContractConfig,
  mlootContractConfig,
  renderHook,
  wagmiContractConfig,
} from '../../../test'
import { useConnect } from '../accounts'
import {
  UseContractWriteArgs,
  UseContractWriteConfig,
  useContractWrite,
} from './useContractWrite'
import {
  UsePrepareContractWriteArgs,
  UsePrepareContractWriteConfig,
  usePrepareContractWrite,
} from './usePrepareContractWrite'

function useContractWriteWithConnect(
  config: UseContractWriteArgs & UseContractWriteConfig,
) {
  return {
    connect: useConnect(),
    contractWrite: useContractWrite(config),
  }
}

function usePrepareContractWritedWithConnect(
  config: UsePrepareContractWriteArgs &
    UsePrepareContractWriteConfig & { chainId?: number },
) {
  const prepareContractWrite = usePrepareContractWrite(config)
  return {
    connect: useConnect(),
    prepareContractWrite,
    contractWrite: useContractWrite({
      chainId: config?.chainId,
      ...prepareContractWrite.config,
    }),
  }
}

describe('useContractWrite', () => {
  describe('mounts', () => {
    it('prepared', async () => {
      const { result } = renderHook(() =>
        useContractWrite({
          mode: 'prepared',
          ...wagmiContractConfig,
          functionName: 'mint',
          request: undefined,
        }),
      )

      expect(result.current).toMatchInlineSnapshot(`
        {
          "data": undefined,
          "error": null,
          "isError": false,
          "isIdle": true,
          "isLoading": false,
          "isSuccess": false,
          "reset": [Function],
          "status": "idle",
          "variables": undefined,
          "write": undefined,
          "writeAsync": undefined,
        }
      `)
    })

    it('recklesslyUnprepared', async () => {
      const tokenId = getRandomTokenId()
      const { result } = renderHook(() =>
        useContractWrite({
          mode: 'recklesslyUnprepared',
          ...wagmiContractConfig,
          functionName: 'mint',
          args: [tokenId],
        }),
      )

      expect(result.current).toMatchInlineSnapshot(`
        {
          "data": undefined,
          "error": null,
          "isError": false,
          "isIdle": true,
          "isLoading": false,
          "isSuccess": false,
          "reset": [Function],
          "status": "idle",
          "variables": undefined,
          "write": [Function],
          "writeAsync": [Function],
        }
      `)
    })
  })

  describe('configuration', () => {
    describe('chainId', () => {
      it('unable to switch', async () => {
        const tokenId = getRandomTokenId()
        const utils = renderHook(() =>
          usePrepareContractWritedWithConnect({
            ...wagmiContractConfig,
            chainId: 69,
            functionName: 'mint',
            args: [tokenId],
          }),
        )

        const { result, waitFor } = utils
        await actConnect({ utils })

        await waitFor(() =>
          expect(result.current.contractWrite.write).toBeDefined(),
        )

        await act(async () => {
          result.current.contractWrite.write?.()
        })

        await waitFor(() =>
          expect(result.current.contractWrite.isError).toBeTruthy(),
        )

        expect(result.current.contractWrite.error).toMatchInlineSnapshot(
          `[ChainMismatchError: Chain mismatch: Expected "Chain 69", received "Ethereum".]`,
        )
      })
    })
  })

  describe('return value', () => {
    describe('write', () => {
      it('prepared', async () => {
        const tokenId = getRandomTokenId()
        const utils = renderHook(() =>
          usePrepareContractWritedWithConnect({
            ...wagmiContractConfig,
            functionName: 'mint',
            args: [tokenId],
          }),
        )

        const { result, waitFor } = utils
        await actConnect({ utils })

        await waitFor(() =>
          expect(result.current.contractWrite.write).toBeDefined(),
        )

        await act(async () => {
          result.current.contractWrite.write?.()
        })

        await waitFor(() =>
          expect(result.current.contractWrite.isSuccess).toBeTruthy(),
        )

        const { data, variables, ...res } = result.current.contractWrite
        expect(data).toBeDefined()
        expect(data?.hash).toBeDefined()
        expect(variables).toBeDefined()
        expect(res).toMatchInlineSnapshot(`
          {
            "error": null,
            "isError": false,
            "isIdle": false,
            "isLoading": false,
            "isSuccess": true,
            "reset": [Function],
            "status": "success",
            "write": [Function],
            "writeAsync": [Function],
          }
        `)
      })

      it('prepared with deferred args', async () => {
        const data = getCrowdfundArgs()
        const utils = renderHook(() =>
          usePrepareContractWritedWithConnect({
            ...mirrorCrowdfundContractConfig,
            functionName: 'createCrowdfund',
            args: data,
          }),
        )
        const { result, waitFor } = utils
        await actConnect({ utils })

        await waitFor(
          () => expect(result.current.contractWrite.write).toBeDefined(),
          { timeout: 10_000 },
        )

        await act(async () => {
          result.current.contractWrite.write?.({
            recklesslySetUnpreparedArgs: getCrowdfundArgs(),
          })
        })
        await waitFor(() =>
          expect(result.current.contractWrite.isSuccess).toBeTruthy(),
        )

        expect(result.current.contractWrite.data?.hash).toBeDefined()
      }, 10_000)

      it('recklesslyUnprepared', async () => {
        const tokenId = getRandomTokenId()
        const utils = renderHook(() =>
          useContractWriteWithConnect({
            mode: 'recklesslyUnprepared',
            ...wagmiContractConfig,
            functionName: 'mint',
            args: [tokenId],
          }),
        )

        const { result, waitFor } = utils
        await actConnect({ utils })

        await act(async () => {
          result.current.contractWrite.write?.()
        })

        await waitFor(() =>
          expect(result.current.contractWrite.isSuccess).toBeTruthy(),
        )

        const { data, variables, ...res } = result.current.contractWrite
        expect(data).toBeDefined()
        expect(data?.hash).toBeDefined()
        expect(variables).toBeDefined()
        expect(res).toMatchInlineSnapshot(`
          {
            "error": null,
            "isError": false,
            "isIdle": false,
            "isLoading": false,
            "isSuccess": true,
            "reset": [Function],
            "status": "success",
            "write": [Function],
            "writeAsync": [Function],
          }
        `)
      })

      it('recklesslyUnprepared with deferred args', async () => {
        const utils = renderHook(() =>
          useContractWriteWithConnect({
            mode: 'recklesslyUnprepared',
            ...mirrorCrowdfundContractConfig,
            functionName: 'createCrowdfund',
          }),
        )
        const { result, waitFor } = utils
        await actConnect({ utils })

        await act(async () =>
          result.current.contractWrite.write?.({
            recklesslySetUnpreparedArgs: getCrowdfundArgs(),
          }),
        )
        await waitFor(() =>
          expect(result.current.contractWrite.isSuccess).toBeTruthy(),
        )

        expect(result.current.contractWrite.data?.hash).toBeDefined()
      })

      it('throws error', async () => {
        const utils = renderHook(() =>
          useContractWriteWithConnect({
            mode: 'recklesslyUnprepared',
            ...mlootContractConfig,
            functionName: 'claim',
            args: 1,
          }),
        )

        const { result, waitFor } = utils
        await actConnect({ utils })

        await act(async () => {
          result.current.contractWrite.write?.()
        })

        await waitFor(() =>
          expect(result.current.contractWrite.isError).toBeTruthy(),
        )

        const { variables, ...res } = result.current.contractWrite
        expect(variables).toBeDefined()
        expect(res).toMatchInlineSnapshot(`
          {
            "data": undefined,
            "error": [Error: cannot estimate gas; transaction may fail or may require manual gas limit [ See: https://links.ethers.org/v5-errors-UNPREDICTABLE_GAS_LIMIT ] (reason="execution reverted: Token ID invalid", method="estimateGas", transaction={"from":"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266","to":"0x1dfe7Ca09e99d10835Bf73044a23B73Fc20623DF","data":"0x379607f50000000000000000000000000000000000000000000000000000000000000001","accessList":null}, error={"reason":"processing response error","code":"SERVER_ERROR","body":"{\\"jsonrpc\\":\\"2.0\\",\\"id\\":42,\\"error\\":{\\"code\\":3,\\"message\\":\\"execution reverted: Token ID invalid\\",\\"data\\":\\"0x08c379a000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000010546f6b656e20494420696e76616c696400000000000000000000000000000000\\"}}","error":{"code":3,"data":"0x08c379a000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000010546f6b656e20494420696e76616c696400000000000000000000000000000000"},"requestBody":"{\\"method\\":\\"eth_estimateGas\\",\\"params\\":[{\\"from\\":\\"0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266\\",\\"to\\":\\"0x1dfe7ca09e99d10835bf73044a23b73fc20623df\\",\\"data\\":\\"0x379607f50000000000000000000000000000000000000000000000000000000000000001\\"}],\\"id\\":42,\\"jsonrpc\\":\\"2.0\\"}","requestMethod":"POST","url":"http://127.0.0.1:8545"}, code=UNPREDICTABLE_GAS_LIMIT, version=providers/5.7.0)],
            "isError": true,
            "isIdle": false,
            "isLoading": false,
            "isSuccess": false,
            "reset": [Function],
            "status": "error",
            "write": [Function],
            "writeAsync": [Function],
          }
        `)
      })
    })

    describe('writeAsync', () => {
      it('prepared', async () => {
        const tokenId = getRandomTokenId()
        const utils = renderHook(() =>
          usePrepareContractWritedWithConnect({
            ...wagmiContractConfig,
            functionName: 'mint',
            args: [tokenId],
          }),
        )

        const { result, waitFor } = utils
        await actConnect({ utils })

        await waitFor(() =>
          expect(result.current.contractWrite.writeAsync).toBeDefined(),
        )

        await act(async () => {
          const res = await result.current.contractWrite.writeAsync?.()
          expect(res?.hash).toBeDefined()
        })

        await waitFor(() =>
          expect(result.current.contractWrite.isSuccess).toBeTruthy(),
        )

        const { data, variables, ...res } = result.current.contractWrite
        expect(data).toBeDefined()
        expect(data?.hash).toBeDefined()
        expect(variables).toBeDefined()
        expect(res).toMatchInlineSnapshot(`
            {
              "error": null,
              "isError": false,
              "isIdle": false,
              "isLoading": false,
              "isSuccess": true,
              "reset": [Function],
              "status": "success",
              "write": [Function],
              "writeAsync": [Function],
            }
          `)
      })

      it('prepared with deferred args', async () => {
        const data = getCrowdfundArgs()
        const utils = renderHook(() =>
          usePrepareContractWritedWithConnect({
            ...mirrorCrowdfundContractConfig,
            functionName: 'createCrowdfund',
            args: data,
          }),
        )
        const { result, waitFor } = utils
        await actConnect({ utils })

        await waitFor(() =>
          expect(result.current.contractWrite.writeAsync).toBeDefined(),
        )

        await act(async () => {
          const res = await result.current.contractWrite.writeAsync?.({
            recklesslySetUnpreparedArgs: getCrowdfundArgs(),
          })
          expect(res?.hash).toBeDefined()
        })
        await waitFor(() =>
          expect(result.current.contractWrite.isSuccess).toBeTruthy(),
        )

        expect(result.current.contractWrite.data?.hash).toBeDefined()
      })

      it('recklesslyUnprepared', async () => {
        const tokenId = getRandomTokenId()
        const utils = renderHook(() =>
          useContractWriteWithConnect({
            mode: 'recklesslyUnprepared',
            ...wagmiContractConfig,
            functionName: 'mint',
            args: [tokenId],
          }),
        )

        const { result, waitFor } = utils
        await actConnect({ utils })

        await act(async () => {
          const res = await result.current.contractWrite.writeAsync?.()
          expect(res?.hash).toBeDefined()
        })

        await waitFor(() =>
          expect(result.current.contractWrite.isSuccess).toBeTruthy(),
        )

        const { data, variables, ...res } = result.current.contractWrite
        expect(data).toBeDefined()
        expect(data?.hash).toBeDefined()
        expect(variables).toBeDefined()
        expect(res).toMatchInlineSnapshot(`
            {
              "error": null,
              "isError": false,
              "isIdle": false,
              "isLoading": false,
              "isSuccess": true,
              "reset": [Function],
              "status": "success",
              "write": [Function],
              "writeAsync": [Function],
            }
          `)
      })

      it('recklesslyUnprepared with deferred args', async () => {
        const utils = renderHook(() =>
          useContractWriteWithConnect({
            mode: 'recklesslyUnprepared',
            ...mirrorCrowdfundContractConfig,
            functionName: 'createCrowdfund',
          }),
        )
        const { result, waitFor } = utils
        await actConnect({ utils })

        await act(async () => {
          const res = await result.current.contractWrite.writeAsync?.({
            recklesslySetUnpreparedArgs: getCrowdfundArgs(),
          })
          expect(res?.hash).toBeDefined()
        })
        await waitFor(() =>
          expect(result.current.contractWrite.isSuccess).toBeTruthy(),
        )

        expect(result.current.contractWrite.data?.hash).toBeDefined()
      })

      it('throws error', async () => {
        const utils = renderHook(() =>
          useContractWriteWithConnect({
            mode: 'recklesslyUnprepared',
            ...mlootContractConfig,
            functionName: 'claim',
            args: [1],
          }),
        )

        const { result, waitFor } = utils
        await actConnect({ utils })

        await act(async () => {
          await expect(
            result.current.contractWrite.writeAsync?.({
              recklesslySetUnpreparedArgs: 1,
            }),
          ).rejects.toThrowErrorMatchingInlineSnapshot(
            '"cannot estimate gas; transaction may fail or may require manual gas limit [ See: https://links.ethers.org/v5-errors-UNPREDICTABLE_GAS_LIMIT ] (reason=\\"execution reverted: Token ID invalid\\", method=\\"estimateGas\\", transaction={\\"from\\":\\"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266\\",\\"to\\":\\"0x1dfe7Ca09e99d10835Bf73044a23B73Fc20623DF\\",\\"data\\":\\"0x379607f50000000000000000000000000000000000000000000000000000000000000001\\",\\"accessList\\":null}, error={\\"reason\\":\\"processing response error\\",\\"code\\":\\"SERVER_ERROR\\",\\"body\\":\\"{\\\\\\"jsonrpc\\\\\\":\\\\\\"2.0\\\\\\",\\\\\\"id\\\\\\":42,\\\\\\"error\\\\\\":{\\\\\\"code\\\\\\":3,\\\\\\"message\\\\\\":\\\\\\"execution reverted: Token ID invalid\\\\\\",\\\\\\"data\\\\\\":\\\\\\"0x08c379a000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000010546f6b656e20494420696e76616c696400000000000000000000000000000000\\\\\\"}}\\",\\"error\\":{\\"code\\":3,\\"data\\":\\"0x08c379a000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000010546f6b656e20494420696e76616c696400000000000000000000000000000000\\"},\\"requestBody\\":\\"{\\\\\\"method\\\\\\":\\\\\\"eth_estimateGas\\\\\\",\\\\\\"params\\\\\\":[{\\\\\\"from\\\\\\":\\\\\\"0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266\\\\\\",\\\\\\"to\\\\\\":\\\\\\"0x1dfe7ca09e99d10835bf73044a23b73fc20623df\\\\\\",\\\\\\"data\\\\\\":\\\\\\"0x379607f50000000000000000000000000000000000000000000000000000000000000001\\\\\\"}],\\\\\\"id\\\\\\":42,\\\\\\"jsonrpc\\\\\\":\\\\\\"2.0\\\\\\"}\\",\\"requestMethod\\":\\"POST\\",\\"url\\":\\"http://127.0.0.1:8545\\"}, code=UNPREDICTABLE_GAS_LIMIT, version=providers/5.7.0)"',
          )
        })
        await waitFor(() =>
          expect(result.current.contractWrite.isError).toBeTruthy(),
        )
      })
    })
  })

  describe('behavior', () => {
    it('multiple writes', async () => {
      const tokenId = getRandomTokenId()
      let args: any[] | any = [tokenId]
      let functionName = 'mint'
      const utils = renderHook(() =>
        usePrepareContractWritedWithConnect({
          ...wagmiContractConfig,
          functionName,
          args,
        }),
      )
      const { result, rerender, waitFor } = utils
      await actConnect({ utils })

      await waitFor(() =>
        expect(result.current.contractWrite.write).toBeDefined(),
      )
      await act(async () => result.current.contractWrite.write?.())
      await waitFor(() =>
        expect(result.current.contractWrite.isSuccess).toBeTruthy(),
      )

      expect(result.current.contractWrite.data?.hash).toBeDefined()

      const from = await getSigners()[0]?.getAddress()
      const to = await getSigners()[1]?.getAddress()
      functionName = 'transferFrom'
      args = [from, to, tokenId]
      rerender()

      await actConnect({ utils })

      await waitFor(() =>
        expect(result.current.contractWrite.write).toBeDefined(),
      )
      await act(async () => result.current.contractWrite.write?.())
      await waitFor(() =>
        expect(result.current.contractWrite.isSuccess).toBeTruthy(),
      )

      expect(result.current.contractWrite.data?.hash).toBeDefined()
    })
  })
})
