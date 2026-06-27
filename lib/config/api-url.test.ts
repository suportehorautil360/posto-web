import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveApiUrl } from "./api-url";

describe("resolveApiUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("na Vercel usa /api (proxy same-origin)", () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "back-liart-psi.vercel.app");
    expect(resolveApiUrl()).toBe("/api");
  });

  it("local sem env aponta pro back na :3000", () => {
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");
    expect(resolveApiUrl()).toBe("http://localhost:3000");
  });
});
