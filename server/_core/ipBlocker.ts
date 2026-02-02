/**
 * IP-Based Blocking for Failed Authentication Attempts
 * 
 * Tracks failed authentication attempts per IP and blocks IPs that exceed
 * the threshold within a time window.
 */

interface FailedAttempt {
  count: number;
  firstAttempt: number;
  blockedUntil: number | null;
}

// Configuration
const MAX_FAILED_ATTEMPTS = 5; // Max failed attempts before blocking
const WINDOW_MS = 15 * 60 * 1000; // 15 minute window
const BLOCK_DURATION_MS = 30 * 60 * 1000; // 30 minute block duration
const ESCALATION_MULTIPLIER = 2; // Each subsequent block doubles duration

// In-memory store for failed attempts (use Redis in production for distributed systems)
const failedAttempts = new Map<string, FailedAttempt>();

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  Array.from(failedAttempts.entries()).forEach(([ip, data]) => {
    // Remove entries that are past their block time and window
    if (data.blockedUntil && now > data.blockedUntil + WINDOW_MS) {
      failedAttempts.delete(ip);
    } else if (!data.blockedUntil && now > data.firstAttempt + WINDOW_MS) {
      failedAttempts.delete(ip);
    }
  });
}, 5 * 60 * 1000); // Clean up every 5 minutes

/**
 * Check if an IP is currently blocked
 */
export function isIpBlocked(ip: string): { blocked: boolean; remainingMs?: number } {
  const data = failedAttempts.get(ip);
  
  if (!data || !data.blockedUntil) {
    return { blocked: false };
  }
  
  const now = Date.now();
  if (now < data.blockedUntil) {
    return { 
      blocked: true, 
      remainingMs: data.blockedUntil - now 
    };
  }
  
  // Block has expired, reset the blocked status but keep count for escalation
  data.blockedUntil = null;
  return { blocked: false };
}

/**
 * Record a failed authentication attempt
 * Returns true if the IP should now be blocked
 */
export function recordFailedAttempt(ip: string): { 
  shouldBlock: boolean; 
  attemptCount: number;
  blockDurationMs?: number;
} {
  const now = Date.now();
  let data = failedAttempts.get(ip);
  
  if (!data) {
    data = { count: 0, firstAttempt: now, blockedUntil: null };
    failedAttempts.set(ip, data);
  }
  
  // Reset count if window has passed
  if (now > data.firstAttempt + WINDOW_MS && !data.blockedUntil) {
    data.count = 0;
    data.firstAttempt = now;
  }
  
  data.count++;
  
  if (data.count >= MAX_FAILED_ATTEMPTS) {
    // Calculate block duration with escalation
    const previousBlocks = Math.floor(data.count / MAX_FAILED_ATTEMPTS) - 1;
    const blockDuration = BLOCK_DURATION_MS * Math.pow(ESCALATION_MULTIPLIER, Math.min(previousBlocks, 4));
    data.blockedUntil = now + blockDuration;
    
    console.log(`[Security] IP ${maskIp(ip)} blocked for ${blockDuration / 1000}s after ${data.count} failed attempts`);
    
    return { 
      shouldBlock: true, 
      attemptCount: data.count,
      blockDurationMs: blockDuration
    };
  }
  
  return { shouldBlock: false, attemptCount: data.count };
}

/**
 * Record a successful authentication (resets failed attempts)
 */
export function recordSuccessfulAuth(ip: string): void {
  failedAttempts.delete(ip);
}

/**
 * Manually unblock an IP (admin function)
 */
export function unblockIp(ip: string): boolean {
  const data = failedAttempts.get(ip);
  if (data) {
    failedAttempts.delete(ip);
    console.log(`[Security] IP ${maskIp(ip)} manually unblocked`);
    return true;
  }
  return false;
}

/**
 * Get blocking status for all IPs (admin function)
 */
export function getBlockedIps(): Array<{ 
  ip: string; 
  attemptCount: number; 
  blockedUntil: Date | null;
  remainingMs: number | null;
}> {
  const now = Date.now();
  const blocked: Array<{ 
    ip: string; 
    attemptCount: number; 
    blockedUntil: Date | null;
    remainingMs: number | null;
  }> = [];
  
  Array.from(failedAttempts.entries()).forEach(([ip, data]) => {
    if (data.blockedUntil && now < data.blockedUntil) {
      blocked.push({
        ip: maskIp(ip),
        attemptCount: data.count,
        blockedUntil: new Date(data.blockedUntil),
        remainingMs: data.blockedUntil - now,
      });
    }
  });
  
  return blocked;
}

/**
 * Mask IP address for logging (privacy)
 */
function maskIp(ip: string): string {
  if (ip.includes(':')) {
    // IPv6: show first 4 groups
    const parts = ip.split(':');
    return parts.slice(0, 4).join(':') + ':****';
  }
  // IPv4: show first 2 octets
  const parts = ip.split('.');
  return parts.slice(0, 2).join('.') + '.***';
}

/**
 * Get client IP from request
 */
export function getClientIp(req: { ip?: string; headers: Record<string, string | string[] | undefined> }): string {
  // Trust proxy is enabled, so req.ip should be accurate
  if (req.ip) {
    return req.ip;
  }
  
  // Fallback to X-Forwarded-For
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return ips.split(',')[0].trim();
  }
  
  return 'unknown';
}
