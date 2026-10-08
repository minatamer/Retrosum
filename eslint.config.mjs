import js from "@eslint/js";
import ts from "typescript-eslint";
import next from "@next/eslint-plugin-next";
import hooks from "eslint-plugin-react-hooks";
import react from "eslint-plugin-react-x";
import globals from "globals";
export default ts.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/next-env.d.ts",
      "**/coverage/**",
      "apps/frontend/public/pdfjs/**",
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ["**/*.{mjs,ts,tsx}"],
    languageOptions: { globals: { ...globals.node } },
    rules: {
      "no-console": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["apps/frontend/**/*.{ts,tsx}"],
    plugins: { "@next/next": next, "react-hooks": hooks, "react-x": react },
    rules: {
      ...next.configs.recommended.rules,
      ...next.configs["core-web-vitals"].rules,
      ...hooks.configs.recommended.rules,
      ...react.configs.recommended.rules,
    },
    settings: { next: { rootDir: "apps/frontend/" } },
  },
  {
    files: ["apps/frontend/src/**/*.{ts,tsx}", "packages/**/*.ts"],
    languageOptions: {
      globals: {
        ...Object.fromEntries(Object.keys(globals.node).map((key) => [key, "off"])),
        ...globals.browser,
      },
    },
    rules: { "no-restricted-globals": ["error", "process", "Buffer"] },
  },
  {
    files: ["apps/frontend/src/**/*.server.ts", "apps/frontend/src/app/api/**/*.ts"],
    languageOptions: { globals: globals.node },
    rules: { "no-restricted-globals": "off" },
  },
  {
    files: ["**/*.test.ts"],
    languageOptions: { globals: globals.node },
    rules: { "no-restricted-globals": "off" },
  },
  { files: ["scripts/**/*.mjs"], rules: { "no-console": "off" } },
);
