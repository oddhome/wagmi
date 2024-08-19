import { vi } from 'vitest'

// Make dates stable across runs
Date.now = vi.fn(() => new Date(Date.UTC(2022, 1, 1)).valueOf())

type ReactVersion = '17' | '18'
const reactVersion: ReactVersion =
  <ReactVersion>process.env.REACT_VERSION || '18'

vi.mock('@testing-library/react', async () => {
  const packages = {
    '18': '@testing-library/react',
    '17': '@testing-library/react-hooks',
  }

  return await vi.importActual(packages[reactVersion])
})
