import { z } from "zod";
const flag = (fallback: "true" | "false") =>
  z
    .enum(["true", "false"])
    .default(fallback)
    .transform((value) => value === "true");
const configSchema = z.object({
  FAKE_MODE: flag("true"),
  PAID_DEMO_ENABLED: flag("false"),
  LIVE_DOCUMENTS_ENABLED: flag("false"),
  LIVE_COPILOT_ENABLED: flag("false"),
  AI_PROVIDER: z.enum(["fake", "openai"]).default("fake"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  HOST: z.enum(["127.0.0.1", "0.0.0.0"]).default("127.0.0.1"),
  FRONTEND_ORIGIN: z
    .url()
    .default("http://localhost:3000")
    .refine((value) => {
      const url = new URL(value);
      return (
        ["http:", "https:"].includes(url.protocol) &&
        url.origin === value &&
        !url.username &&
        !url.password
      );
    }),
  OPENAI_API_KEY: z.string().max(300).default(""),
  TURNSTILE_SECRET_KEY: z.string().max(300).default(""),
  TURNSTILE_SITE_KEY: z
    .string()
    .regex(/^[A-Za-z0-9_-]{0,100}$/u)
    .default(""),
  GRANT_SIGNING_SECRET: z.string().max(300).default(""),
});
export type AppConfig = Readonly<z.infer<typeof configSchema>>;
export function parseConfig(environment: Record<string, string | undefined>): AppConfig {
  const parsed = configSchema.safeParse(environment);
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map((issue) => issue.path[0]))].join(", ");
    throw new Error("Invalid configuration fields: " + fields);
  }
  return Object.freeze(parsed.data);
}
