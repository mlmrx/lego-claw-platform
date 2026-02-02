import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  isIpBlocked,
  recordFailedAttempt,
  recordSuccessfulAuth,
  getClientIp,
} from "./_core/ipBlocker";
import {
  generateWebhookSignature,
  verifyWebhookSignature,
  generateWebhookSecret,
  createSignedWebhookPayload,
  WEBHOOK_SIGNATURE_HEADER,
  WEBHOOK_TIMESTAMP_HEADER,
} from "./_core/webhookVerification";
import { generateRequestId } from "./_core/auditLog";

describe("IP-Based Blocking", () => {
  // Note: These tests use the shared in-memory store, so order matters
  const testIp = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

  describe("isIpBlocked", () => {
    it("returns not blocked for unknown IPs", () => {
      const result = isIpBlocked("10.0.0.1");
      expect(result.blocked).toBe(false);
    });
  });

  describe("recordFailedAttempt", () => {
    it("tracks failed attempts", () => {
      const result = recordFailedAttempt(testIp);
      expect(result.attemptCount).toBe(1);
      expect(result.shouldBlock).toBe(false);
    });

    it("increments attempt count", () => {
      const result = recordFailedAttempt(testIp);
      expect(result.attemptCount).toBe(2);
    });
  });

  describe("recordSuccessfulAuth", () => {
    it("resets failed attempts on success", () => {
      const newIp = `10.${Math.floor(Math.random() * 255)}.0.1`;
      recordFailedAttempt(newIp);
      recordFailedAttempt(newIp);
      recordSuccessfulAuth(newIp);
      
      // After success, IP should not be blocked
      const result = isIpBlocked(newIp);
      expect(result.blocked).toBe(false);
    });
  });

  describe("getClientIp", () => {
    it("extracts IP from request object", () => {
      const req = {
        ip: "192.168.1.1",
        headers: {},
      };
      expect(getClientIp(req)).toBe("192.168.1.1");
    });

    it("falls back to X-Forwarded-For header", () => {
      const req = {
        headers: {
          "x-forwarded-for": "10.0.0.1, 192.168.1.1",
        },
      };
      expect(getClientIp(req)).toBe("10.0.0.1");
    });

    it("returns unknown for missing IP", () => {
      const req = { headers: {} };
      expect(getClientIp(req)).toBe("unknown");
    });
  });
});

describe("Webhook Signature Verification", () => {
  const testSecret = "test-secret-key-12345";
  const testPayload = JSON.stringify({ event: "test", data: { id: 1 } });
  const testTimestamp = Date.now();

  describe("generateWebhookSignature", () => {
    it("generates consistent signatures", () => {
      const sig1 = generateWebhookSignature(testPayload, testSecret, testTimestamp);
      const sig2 = generateWebhookSignature(testPayload, testSecret, testTimestamp);
      expect(sig1).toBe(sig2);
    });

    it("generates different signatures for different payloads", () => {
      const sig1 = generateWebhookSignature(testPayload, testSecret, testTimestamp);
      const sig2 = generateWebhookSignature("different", testSecret, testTimestamp);
      expect(sig1).not.toBe(sig2);
    });

    it("generates different signatures for different secrets", () => {
      const sig1 = generateWebhookSignature(testPayload, testSecret, testTimestamp);
      const sig2 = generateWebhookSignature(testPayload, "other-secret", testTimestamp);
      expect(sig1).not.toBe(sig2);
    });

    it("generates different signatures for different timestamps", () => {
      const sig1 = generateWebhookSignature(testPayload, testSecret, testTimestamp);
      const sig2 = generateWebhookSignature(testPayload, testSecret, testTimestamp + 1000);
      expect(sig1).not.toBe(sig2);
    });
  });

  describe("verifyWebhookSignature", () => {
    it("validates correct signatures", () => {
      const signature = generateWebhookSignature(testPayload, testSecret, testTimestamp);
      const result = verifyWebhookSignature(testPayload, signature, testSecret, testTimestamp);
      expect(result.valid).toBe(true);
    });

    it("rejects incorrect signatures", () => {
      const result = verifyWebhookSignature(testPayload, "invalid-signature", testSecret, testTimestamp);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("rejects old timestamps", () => {
      const oldTimestamp = Date.now() - 10 * 60 * 1000; // 10 minutes ago
      const signature = generateWebhookSignature(testPayload, testSecret, oldTimestamp);
      const result = verifyWebhookSignature(testPayload, signature, testSecret, oldTimestamp);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("too old");
    });

    it("rejects future timestamps", () => {
      const futureTimestamp = Date.now() + 5 * 60 * 1000; // 5 minutes in future
      const signature = generateWebhookSignature(testPayload, testSecret, futureTimestamp);
      const result = verifyWebhookSignature(testPayload, signature, testSecret, futureTimestamp);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("future");
    });
  });

  describe("generateWebhookSecret", () => {
    it("generates 64-character hex strings", () => {
      const secret = generateWebhookSecret();
      expect(secret).toHaveLength(64);
      expect(/^[0-9a-f]+$/.test(secret)).toBe(true);
    });

    it("generates unique secrets", () => {
      const secrets = new Set();
      for (let i = 0; i < 10; i++) {
        secrets.add(generateWebhookSecret());
      }
      expect(secrets.size).toBe(10);
    });
  });

  describe("createSignedWebhookPayload", () => {
    it("creates payload with correct headers", () => {
      const payload = { event: "test" };
      const result = createSignedWebhookPayload(payload, testSecret);
      
      expect(result.body).toBe(JSON.stringify(payload));
      expect(result.headers["Content-Type"]).toBe("application/json");
      expect(result.headers[WEBHOOK_SIGNATURE_HEADER]).toBeDefined();
      expect(result.headers[WEBHOOK_TIMESTAMP_HEADER]).toBeDefined();
    });

    it("creates verifiable signatures", () => {
      const payload = { event: "test" };
      const result = createSignedWebhookPayload(payload, testSecret);
      
      const timestamp = parseInt(result.headers[WEBHOOK_TIMESTAMP_HEADER], 10);
      const verification = verifyWebhookSignature(
        result.body,
        result.headers[WEBHOOK_SIGNATURE_HEADER],
        testSecret,
        timestamp
      );
      
      expect(verification.valid).toBe(true);
    });
  });
});

describe("Audit Logging", () => {
  describe("generateRequestId", () => {
    it("generates 32-character hex strings", () => {
      const id = generateRequestId();
      expect(id).toHaveLength(32);
      expect(/^[0-9a-f]+$/.test(id)).toBe(true);
    });

    it("generates unique IDs", () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateRequestId());
      }
      expect(ids.size).toBe(100);
    });
  });
});
