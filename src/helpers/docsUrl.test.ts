// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getDocsUrl } from "./docsUrl";

describe("getDocsUrl", () => {
  const originalEnv = import.meta.env.VITE_DOCS_URL;

  beforeEach(() => {
    vi.stubEnv("VITE_DOCS_URL", "https://docs.hexlink.org");
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      vi.stubEnv("VITE_DOCS_URL", originalEnv);
    } else {
      vi.unstubAllEnvs();
    }
  });

  it("should return base URL when no path is provided", () => {
    expect(getDocsUrl()).toBe("https://docs.hexlink.org");
    expect(getDocsUrl("")).toBe("https://docs.hexlink.org");
  });

  it("should correctly join base URL with a relative path", () => {
    expect(getDocsUrl("docs/tutorial")).toBe(
      "https://docs.hexlink.org/docs/tutorial",
    );
  });

  it("should handle leading slashes in path", () => {
    expect(getDocsUrl("/docs/governance/terms-and-conditions")).toBe(
      "https://docs.hexlink.org/docs/governance/terms-and-conditions",
    );
  });

  it("should handle leading '/#' in path", () => {
    expect(
      getDocsUrl(
        "/#docs/tips-for-community-runners/creating-your-community",
      ),
    ).toBe(
      "https://docs.hexlink.org/docs/tips-for-community-runners/creating-your-community",
    );
  });

  it("should strip trailing slashes from environment base URL", () => {
    vi.stubEnv("VITE_DOCS_URL", "https://docs.hexlink.org/");
    expect(getDocsUrl("docs/governance/privacy-policy")).toBe(
      "https://docs.hexlink.org/docs/governance/privacy-policy",
    );
  });

  it("should fall back to default domain when VITE_DOCS_URL is undefined", () => {
    vi.stubEnv("VITE_DOCS_URL", undefined as unknown as string);
    expect(getDocsUrl("docs/tutorial")).toBe(
      "https://docs.hexlink.org/docs/tutorial",
    );
  });

  it("should use custom base URL from VITE_DOCS_URL when provided", () => {
    vi.stubEnv("VITE_DOCS_URL", "https://custom-docs.example.com");
    expect(getDocsUrl("docs/tutorial")).toBe(
      "https://custom-docs.example.com/docs/tutorial",
    );
  });
});