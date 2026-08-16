import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // wasm-pack/wasm-bindgen generated glue - never hand-edited, committed
    // as a build artifact (docs/PORTFOLIO_V9_ARCHITECTURE.md polyglot
    // addendum's "Build/deploy separation").
    "crates/**/pkg/**",
  ]),
]);

export default eslintConfig;
