import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    ignores: [
      ".next/**",
      "src/generated/**",
      "node_modules/**",
      "prisma/migrations/**",
    ],
  },
];

export default eslintConfig;
