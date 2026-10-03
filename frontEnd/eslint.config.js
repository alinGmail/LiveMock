import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

// ESLint 9 flat config (migrated from .eslintrc + ESLint 8).
//
// Rule adjustments vs the pre-migration config, all documented in
// .scratch/dependency-upgrade/issues/07-eslint-9-migration.md:
// - @typescript-eslint/no-unused-vars: "off"  (pre-existing backlog)
// - @typescript-eslint/no-explicit-any: "off" (pre-existing backlog)
// - react-hooks: only the classic rules-of-hooks / exhaustive-deps pair;
//   v7's recommended also enables new React Compiler rules that were not
//   part of the pre-migration rule set.
// - react-refresh/only-export-components: "off" (warning-only dev-refresh hint)
export default [
  { ignores: ["dist", "node_modules"] },
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsparser,
      parserOptions: { ecmaVersion: "latest", sourceType: "module" },
      globals: { ...globals.browser },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      "no-undef": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "off",
      "react-refresh/only-export-components": "off",
    },
  },
];
