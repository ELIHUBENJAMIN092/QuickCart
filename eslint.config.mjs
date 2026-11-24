import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

// eslint-config-next 15 usa el plugin react-hooks clásico, que no incluye
// las reglas experimentales set-state-in-effect / purity de la v16.
const eslintConfig = [
  { ignores: ["coverage/**", ".next/**", "node_modules/**"] },
  ...compat.extends("next/core-web-vitals"),
];

export default eslintConfig;
