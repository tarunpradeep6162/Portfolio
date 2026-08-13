import "@testing-library/jest-dom/vitest";

// jsdom has no matchMedia implementation. Individual tests that care about a
// specific value (e.g. tests/unit/useReducedMotion.test.tsx) override this
// per-test; this default just lets any component that happens to render a
// useReducedMotion/useFinePointer consumer (ScrollReveal, HeroCopyReveal,
// etc.) mount without crashing in tests that aren't about motion at all.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
