import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // A hook that reads state but declares no deps silently keeps the values
      // from its first render. That shipped a dead Power dial button once
      // already, so it is an error here, not a warning.
      "react-hooks/exhaustive-deps": "error",
      // Every screen loads itself on mount: an async loader, awaited from an
      // effect, that setStates when the rows arrive. The rule cannot see
      // through the await and flags all 21 of them. The pattern is correct.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
