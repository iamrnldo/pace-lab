// src/test/setup.js
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock lenis
vi.mock('@studio-freight/lenis', () => ({
  default: vi.fn().mockImplementation(() => ({
    on:      vi.fn(),
    off:     vi.fn(),
    raf:     vi.fn(),
    scrollTo: vi.fn(),
    destroy: vi.fn(),
  }))
}))

// Mock gsap
vi.mock('gsap', () => ({
  gsap: {
    timeline:   vi.fn(() => ({ fromTo: vi.fn(), kill: vi.fn() })),
    fromTo:     vi.fn(),
    ticker:     { add: vi.fn(), lagSmoothing: vi.fn(), remove: vi.fn() },
    registerPlugin: vi.fn(),
  },
  ScrollTrigger: {
    update:  vi.fn(),
    getAll:  vi.fn(() => []),
    kill:    vi.fn(),
  }
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches:            false,
    media:              query,
    onchange:           null,
    addListener:        vi.fn(),
    removeListener:     vi.fn(),
    addEventListener:   vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent:      vi.fn(),
  })),
})