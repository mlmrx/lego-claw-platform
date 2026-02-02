/**
 * Webhook Signature Verification
 * 
 * Validates incoming webhook requests using HMAC-SHA256 signatures.
 * This ensures webhooks are authentic and haven't been tampered with.
 */

import crypto from "crypto";

// Signature header name
export const WEBHOOK_SIGNATURE_HEADER = "x-webhook-signature";
export const WEBHOOK_TIMESTAMP_HEADER = "x-webhook-timestamp";

// Maximum age for webhook requests (5 minutes)
const MAX_WEBHOOK_AGE_MS = 5 * 60 * 1000;

/**
 * Generate HMAC-SHA256 signature for webhook payload
 */
export function generateWebhookSignature(
  payload: string | Buffer,
  secret: string,
  timestamp: number
): string {
  const signaturePayload = `${timestamp}.${typeof payload === "string" ? payload : payload.toString("utf8")}`;
  return crypto
    .createHmac("sha256", secret)
    .update(signaturePayload)
    .digest("hex");
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string,
  timestamp: number
): { valid: boolean; error?: string } {
  // Check timestamp to prevent replay attacks
  const now = Date.now();
  const age = now - timestamp;
  
  if (age > MAX_WEBHOOK_AGE_MS) {
    return { 
      valid: false, 
      error: `Webhook timestamp too old (${Math.round(age / 1000)}s ago, max ${MAX_WEBHOOK_AGE_MS / 1000}s)` 
    };
  }
  
  if (timestamp > now + 60000) { // Allow 1 minute clock skew into the future
    return { 
      valid: false, 
      error: "Webhook timestamp is in the future" 
    };
  }
  
  // Generate expected signature
  const expectedSignature = generateWebhookSignature(payload, secret, timestamp);
  
  // Use timing-safe comparison to prevent timing attacks
  try {
    const signatureBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    
    if (signatureBuffer.length !== expectedBuffer.length) {
      return { valid: false, error: "Invalid signature format" };
    }
    
    const isValid = crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
    return { valid: isValid, error: isValid ? undefined : "Signature mismatch" };
  } catch {
    return { valid: false, error: "Invalid signature format" };
  }
}

/**
 * Express middleware for webhook signature verification
 */
export function webhookVerificationMiddleware(getSecret: (req: any) => Promise<string | null>) {
  return async (req: any, res: any, next: any) => {
    const signature = req.headers[WEBHOOK_SIGNATURE_HEADER];
    const timestampHeader = req.headers[WEBHOOK_TIMESTAMP_HEADER];
    
    if (!signature || !timestampHeader) {
      return res.status(401).json({
        error: "Missing webhook signature",
        message: `Required headers: ${WEBHOOK_SIGNATURE_HEADER}, ${WEBHOOK_TIMESTAMP_HEADER}`,
      });
    }
    
    const timestamp = parseInt(timestampHeader, 10);
    if (isNaN(timestamp)) {
      return res.status(400).json({
        error: "Invalid timestamp",
        message: "Timestamp must be a valid Unix timestamp in milliseconds",
      });
    }
    
    // Get the secret for this webhook
    const secret = await getSecret(req);
    if (!secret) {
      return res.status(401).json({
        error: "Unknown webhook source",
        message: "Could not find webhook secret for this request",
      });
    }
    
    // Get raw body for signature verification
    const rawBody = req.rawBody || JSON.stringify(req.body);
    
    const result = verifyWebhookSignature(rawBody, signature, secret, timestamp);
    
    if (!result.valid) {
      console.warn(`[Webhook] Signature verification failed: ${result.error}`);
      return res.status(401).json({
        error: "Invalid webhook signature",
        message: result.error,
      });
    }
    
    // Signature valid, proceed
    next();
  };
}

/**
 * Generate a secure webhook secret
 */
export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Create signed webhook payload for outgoing webhooks
 */
export function createSignedWebhookPayload(
  payload: object,
  secret: string
): {
  body: string;
  headers: Record<string, string>;
} {
  const timestamp = Date.now();
  const body = JSON.stringify(payload);
  const signature = generateWebhookSignature(body, secret, timestamp);
  
  return {
    body,
    headers: {
      "Content-Type": "application/json",
      [WEBHOOK_SIGNATURE_HEADER]: signature,
      [WEBHOOK_TIMESTAMP_HEADER]: timestamp.toString(),
    },
  };
}
