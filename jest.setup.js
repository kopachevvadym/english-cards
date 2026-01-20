// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

import '@testing-library/jest-dom'

// Provide a minimal in-memory localStorage implementation for tests.
// Many hooks rely on real getItem/setItem behavior (not just jest.fn stubs).
const store = {}

global.localStorage = {
  getItem: jest.fn((key) => (key in store ? store[key] : null)),
  setItem: jest.fn((key, value) => {
    store[key] = String(value)
  }),
  removeItem: jest.fn((key) => {
    delete store[key]
  }),
  clear: jest.fn(() => {
    Object.keys(store).forEach((k) => delete store[k])
  }),
}

// jsdom provides window; ensure code using window.localStorage works too.
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: global.localStorage,
    writable: true,
  })
}
