import "@testing-library/jest-dom";

// jsdom lacks ResizeObserver, which some Radix primitives touch on mount.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = globalThis.ResizeObserver ?? (ResizeObserverStub as unknown as typeof ResizeObserver);

// Mock localStorage for Zustand persist
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock crypto.randomUUID
Object.defineProperty(globalThis, "crypto", {
  value: {
    randomUUID: () => Math.random().toString(36).substring(2, 15),
  },
});
