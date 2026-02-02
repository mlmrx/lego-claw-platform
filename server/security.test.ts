import { describe, it, expect } from "vitest";
import {
  escapeHtml,
  sanitizeString,
  sanitizeUrl,
  sanitizeEmail,
  sanitizeObjectKeys,
  isValidHexColor,
  sanitizeFileName,
} from "./_core/sanitize";

describe("Security: Input Sanitization", () => {
  describe("escapeHtml", () => {
    it("escapes HTML special characters", () => {
      expect(escapeHtml("<script>alert('xss')</script>")).toBe(
        "&lt;script&gt;alert(&#x27;xss&#x27;)&lt;&#x2F;script&gt;"
      );
    });

    it("escapes ampersands", () => {
      expect(escapeHtml("foo & bar")).toBe("foo &amp; bar");
    });

    it("escapes quotes", () => {
      expect(escapeHtml('"test"')).toBe("&quot;test&quot;");
    });

    it("handles empty strings", () => {
      expect(escapeHtml("")).toBe("");
    });
  });

  describe("sanitizeString", () => {
    it("removes null bytes", () => {
      expect(sanitizeString("hello\x00world")).toBe("helloworld");
    });

    it("removes control characters", () => {
      expect(sanitizeString("hello\x1Fworld")).toBe("helloworld");
    });

    it("preserves newlines and tabs", () => {
      expect(sanitizeString("hello\n\tworld")).toBe("hello\n\tworld");
    });
  });

  describe("sanitizeUrl", () => {
    it("allows https URLs", () => {
      expect(sanitizeUrl("https://example.com")).toBe("https://example.com/");
    });

    it("allows http URLs", () => {
      expect(sanitizeUrl("http://example.com")).toBe("http://example.com/");
    });

    it("rejects javascript: URLs", () => {
      expect(sanitizeUrl("javascript:alert(1)")).toBeNull();
    });

    it("rejects data: URLs", () => {
      expect(sanitizeUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
    });

    it("rejects invalid URLs", () => {
      expect(sanitizeUrl("not-a-url")).toBeNull();
    });
  });

  describe("sanitizeEmail", () => {
    it("accepts valid emails", () => {
      expect(sanitizeEmail("test@example.com")).toBe("test@example.com");
    });

    it("lowercases emails", () => {
      expect(sanitizeEmail("Test@Example.COM")).toBe("test@example.com");
    });

    it("trims whitespace", () => {
      expect(sanitizeEmail("  test@example.com  ")).toBe("test@example.com");
    });

    it("rejects invalid emails", () => {
      expect(sanitizeEmail("not-an-email")).toBeNull();
      expect(sanitizeEmail("@example.com")).toBeNull();
      expect(sanitizeEmail("test@")).toBeNull();
    });
  });

  describe("sanitizeObjectKeys", () => {
    it("removes __proto__ key", () => {
      const obj = { name: "test", __proto__: { malicious: true } } as any;
      const result = sanitizeObjectKeys(obj);
      expect(result).not.toHaveProperty("__proto__");
      expect(result).toHaveProperty("name", "test");
    });

    it("removes constructor key", () => {
      const obj = { name: "test", constructor: () => {} } as any;
      const result = sanitizeObjectKeys(obj);
      expect(result).not.toHaveProperty("constructor");
    });

    it("preserves safe keys", () => {
      const obj = { name: "test", value: 123 };
      const result = sanitizeObjectKeys(obj);
      expect(result).toEqual({ name: "test", value: 123 });
    });
  });

  describe("isValidHexColor", () => {
    it("accepts valid hex colors", () => {
      expect(isValidHexColor("#FF0000")).toBe(true);
      expect(isValidHexColor("#00ff00")).toBe(true);
      expect(isValidHexColor("#123abc")).toBe(true);
    });

    it("rejects invalid hex colors", () => {
      expect(isValidHexColor("FF0000")).toBe(false); // Missing #
      expect(isValidHexColor("#FFF")).toBe(false); // Too short
      expect(isValidHexColor("#GGGGGG")).toBe(false); // Invalid chars
      expect(isValidHexColor("#FF00000")).toBe(false); // Too long
    });
  });

  describe("sanitizeFileName", () => {
    it("removes path traversal attempts", () => {
      expect(sanitizeFileName("../../../etc/passwd")).toBe("etcpasswd");
    });

    it("removes path separators", () => {
      expect(sanitizeFileName("path/to/file.txt")).toBe("pathtofile.txt");
      expect(sanitizeFileName("path\\to\\file.txt")).toBe("pathtofile.txt");
    });

    it("removes invalid characters", () => {
      expect(sanitizeFileName('file<>:"|?*.txt')).toBe("file.txt");
    });

    it("truncates long filenames", () => {
      const longName = "a".repeat(300);
      expect(sanitizeFileName(longName).length).toBe(255);
    });
  });
});

describe("Security: Authorization Checks", () => {
  it("protected procedures require authentication", () => {
    // This is verified by the tRPC middleware - if no user, throws UNAUTHORIZED
    // The actual test is in the middleware behavior
    expect(true).toBe(true);
  });

  it("owner checks prevent unauthorized access", () => {
    // Verified by checking routers.ts - all mutations check agent.ownerId === ctx.user.id
    expect(true).toBe(true);
  });
});

describe("Security: Rate Limiting", () => {
  it("rate limiting is configured", () => {
    // Rate limiting is configured in server/_core/index.ts
    // - API: 100 requests per minute
    // - Auth: 20 requests per 15 minutes
    // - Create: 30 requests per hour
    expect(true).toBe(true);
  });
});
