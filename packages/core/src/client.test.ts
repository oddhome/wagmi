import { getDefaultProvider } from 'ethers'
import { describe, expect, it } from 'vitest'

import { getProvider, getSigners, getWebSocketProvider } from '../test'
import { Client, createClient, getClient } from './client'
import { MockConnector } from './connectors/mock'
import { defaultChains } from './constants'
import { createStorage, noopStorage } from './storage'

const provider = () =>
  Object.assign(getDefaultProvider(), { chains: defaultChains })

describe('createClient', () => {
  it('returns client', () => {
    const client = createClient({
      provider,
    })
    expect(client).toBeInstanceOf(Client)
  })

  describe('config', () => {
    describe('autoConnect', () => {
      describe('true', () => {
        it('disconnected', async () => {
          const client = createClient({
            autoConnect: true,
            provider,
          })
          expect(client.status).toMatchInlineSnapshot(`"connecting"`)
          await client.autoConnect()
          expect(client.status).toMatchInlineSnapshot(`"disconnected"`)
        })

        it('connected', async () => {
          const client = createClient({
            autoConnect: true,
            connectors: [
              new MockConnector({
                options: {
                  flags: { isAuthorized: true },
                  signer: getSigners()[0]!,
                },
              }),
            ],
            provider,
          })
          expect(client.status).toMatchInlineSnapshot(`"connecting"`)
          await client.autoConnect()
          expect(client.status).toMatchInlineSnapshot(`"connected"`)
        })

        it('reconnected', async () => {
          const localStorage: Record<string, any> = {}
          const storage = createStorage({
            storage: {
              getItem: (key) => localStorage[key],
              setItem: (key, value) =>
                (localStorage[key] = JSON.stringify(value)),
              removeItem: (key) => delete localStorage[key],
            },
          })
          storage.setItem('store', {
            state: {
              data: {
                account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
              },
            },
          })
          const client = createClient({
            autoConnect: true,
            connectors: [
              new MockConnector({
                options: {
                  flags: { isAuthorized: true },
                  signer: getSigners()[0]!,
                },
              }),
            ],
            provider,
            storage,
          })
          expect(client.status).toMatchInlineSnapshot(`"reconnecting"`)
          await client.autoConnect()
          expect(client.status).toMatchInlineSnapshot(`"connected"`)
        })
      })

      it('false', () => {
        const client = createClient({
          autoConnect: false,
          provider,
        })
        expect(client.status).toMatchInlineSnapshot(`"disconnected"`)
      })
    })

    describe('connectors', () => {
      it('default', () => {
        const client = createClient({
          provider,
        })
        expect(client.connectors.map((x) => x.name)).toMatchInlineSnapshot(`
          [
            "Injected",
          ]
        `)
      })

      it('custom', () => {
        const client = createClient({
          connectors: [
            new MockConnector({
              options: {
                signer: getSigners()[0]!,
              },
            }),
          ],
          provider,
        })
        expect(client.connectors.map((x) => x.name)).toMatchInlineSnapshot(`
          [
            "Mock",
          ]
        `)
      })
    })

    describe('provider', () => {
      it('default', () => {
        const client = createClient({
          provider,
        })
        expect(client.provider).toBeDefined()
      })

      it('custom', () => {
        const client = createClient({
          provider: getProvider(),
        })
        expect(client.provider).toMatchInlineSnapshot(
          '"<Provider network={1} />"',
        )
      })
    })

    describe('providers', () => {
      it('default', () => {
        const client = createClient({
          provider: getProvider,
        })
        expect(client.providers).toMatchInlineSnapshot(`
          Map {
            -1 => "<Provider network={1} />",
          }
        `)
      })

      it('chainId changes bust cache', () => {
        const client = createClient({
          provider: getProvider,
        })
        const provider = client.getProvider({ chainId: 69 })
        expect(provider === client.getProvider({ chainId: 69 })).toBeTruthy()
        expect(client.providers).toMatchInlineSnapshot(`
          Map {
            -1 => "<Provider network={1} />",
            69 => "<Provider network={69} />",
          }
        `)
        client.setState((x) => ({
          ...x,
          data: { ...x.data, chain: { id: 69, unsupported: false } },
        }))
        expect(provider === client.getProvider({ chainId: 69 })).toBeFalsy()
        expect(client.providers).toMatchInlineSnapshot(`
          Map {
            -1 => "<Provider network={1} />",
            69 => "<Provider network={69} />",
          }
        `)
      })

      it('autoConnect w/ stored chainId', () => {
        const client = createClient({
          autoConnect: true,
          storage: createStorage({
            storage: {
              ...noopStorage,
              getItem(key) {
                if (key === 'wagmi.store')
                  return JSON.stringify(
                    JSON.stringify({
                      state: { data: { chain: { id: 69 } } },
                    }),
                  )
                return null
              },
            },
          }),
          provider: getProvider,
        })
        expect(client.providers).toMatchInlineSnapshot(`
          Map {
            69 => "<Provider network={69} />",
          }
        `)
      })
    })

    describe('storage', () => {
      it('default', () => {
        const client = createClient({
          provider,
        })
        expect(client.storage).toMatchInlineSnapshot(`
          {
            "getItem": [Function],
            "removeItem": [Function],
            "setItem": [Function],
          }
        `)
      })

      it('custom', () => {
        const client = createClient({
          provider,
          storage: createStorage({
            storage: window.localStorage,
          }),
        })
        expect(client.storage).toMatchInlineSnapshot(`
          {
            "getItem": [Function],
            "removeItem": [Function],
            "setItem": [Function],
          }
        `)
      })
    })

    describe('webSocketProvider', () => {
      it('default', () => {
        const client = createClient({
          provider,
        })
        expect(client.webSocketProvider).toBeUndefined()
      })

      it('custom', async () => {
        const client = createClient({
          provider,
          webSocketProvider: getWebSocketProvider(),
        })
        await client.webSocketProvider?.destroy()
        expect(client.webSocketProvider).toMatchInlineSnapshot(
          '"<WebSocketProvider network={1} />"',
        )
      })
    })

    describe('webSocketProviders', () => {
      it('default', () => {
        const client = createClient({
          provider,
          webSocketProvider: getWebSocketProvider,
        })
        expect(client.webSocketProviders).toMatchInlineSnapshot(`
          Map {
            -1 => "<WebSocketProvider network={1} />",
          }
        `)
      })

      it('chainId changes bust cache', () => {
        const client = createClient({
          provider: getProvider,
          webSocketProvider: getWebSocketProvider,
        })
        const provider = client.getWebSocketProvider({ chainId: 69 })
        expect(
          provider === client.getWebSocketProvider({ chainId: 69 }),
        ).toBeTruthy()
        expect(client.webSocketProviders).toMatchInlineSnapshot(`
          Map {
            -1 => "<WebSocketProvider network={1} />",
            69 => "<WebSocketProvider network={69} />",
          }
        `)
        client.setState((x) => ({
          ...x,
          data: { ...x.data, chain: { id: 69, unsupported: false } },
        }))
        expect(
          provider === client.getWebSocketProvider({ chainId: 69 }),
        ).toBeFalsy()
        expect(client.webSocketProviders).toMatchInlineSnapshot(`
          Map {
            -1 => "<WebSocketProvider network={1} />",
            69 => "<WebSocketProvider network={69} />",
          }
        `)
      })

      it('autoConnect w/ stored chainId', () => {
        const client = createClient({
          autoConnect: true,
          storage: createStorage({
            storage: {
              ...noopStorage,
              getItem(key) {
                if (key === 'wagmi.store')
                  return JSON.stringify(
                    JSON.stringify({
                      state: { data: { chain: { id: 69 } } },
                    }),
                  )
                return null
              },
            },
          }),
          provider: getProvider,
          webSocketProvider: getWebSocketProvider,
        })
        expect(client.webSocketProviders).toMatchInlineSnapshot(`
          Map {
            69 => "<WebSocketProvider network={69} />",
          }
        `)
      })
    })
  })
})

describe('getClient', () => {
  it('returns default client', () => {
    expect(getClient()).toBeDefined()
  })

  it('returns created client', () => {
    const client = createClient({
      provider,
    })
    expect(getClient()).toEqual(client)
  })
})
