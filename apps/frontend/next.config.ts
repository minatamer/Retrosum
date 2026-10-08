import type { NextConfig } from "next";
import { resolve } from "node:path";
const config: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: resolve(__dirname, "../.."),
  transpilePackages: ["@retrosum/contracts", "@retrosum/money"],
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};
export default config;
