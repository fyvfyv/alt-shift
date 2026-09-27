import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});

// jsdom implements none of these; components call them.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  // Tests run under reduced motion, as some users do, so no page test waits out the orb's fade
  // in real time. LoadingOrb.test.tsx covers the fade itself.
  value: (query: string): MediaQueryList => ({
    matches: query === '(prefers-reduced-motion: reduce)',
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

window.scrollTo = () => {};
Element.prototype.scrollIntoView = () => {};
