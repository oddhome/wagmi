import type { AppProps } from 'next/app'
import NextHead from 'next/head'
import * as React from 'react'
import {
  Chain,
  WagmiConfig,
  chain,
  configureChains,
  createClient,
  defaultChains,
} from 'wagmi'

import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'

import { alchemyProvider } from 'wagmi/providers/alchemy'
import { infuraProvider } from 'wagmi/providers/infura'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'
import { publicProvider } from 'wagmi/providers/public'

const avalanche: Chain = {
  id: 43_114,
  name: 'Avalanche',
  network: 'avalanche',
  nativeCurrency: {
    decimals: 18,
    name: 'Avalanche',
    symbol: 'AVAX',
  },
  rpcUrls: {
    default: 'https://api.avax.network/ext/bc/C/rpc',
  },
  multicall: {
    address: '0xca11bde05977b3631167028862be2a173976ca11',
    blockCreated: 11907934,
  },
  blockExplorers: {
    default: { name: 'SnowTrace', url: 'https://snowtrace.io' },
  },
  testnet: false,
}

const { chains, provider, webSocketProvider } = configureChains(
  [...defaultChains, chain.optimism, avalanche],
  [
    alchemyProvider({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY }),
    infuraProvider({ apiKey: process.env.NEXT_PUBLIC_INFURA_API_KEY }),
    jsonRpcProvider({
      rpc: (chain) => {
        if (chain.id !== avalanche.id) return null
        return {
          http: chain.rpcUrls.default,
        }
      },
    }),
    publicProvider(),
  ],
  { targetQuorum: 1 },
)

const client = createClient({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({
      chains,
      options: {
        UNSTABLE_shimOnConnectSelectAccount: true,
      },
    }),
    new CoinbaseWalletConnector({
      chains,
      options: {
        appName: 'wagmi',
      },
    }),
    new WalletConnectConnector({
      chains,
      options: {
        qrcode: true,
      },
    }),
    new InjectedConnector({
      chains,
      options: {
        name: (detectedName) =>
          `Injected (${
            typeof detectedName === 'string'
              ? detectedName
              : detectedName.join(', ')
          })`,
        shimDisconnect: true,
      },
    }),
  ],
  provider,
  webSocketProvider,
})

const App = ({ Component, pageProps }: AppProps) => {
  return (
    <>
      <NextHead>
        <title>wagmi</title>
      </NextHead>

      <WagmiConfig client={client}>
        <Component {...pageProps} />
      </WagmiConfig>
    </>
  )
}

export default App
