// Rate limiting with both user-level and IP-level tracking
interface RateLimitConfig {
  userLimit: number;
  ipLimit: number;
  windowMs: number;
}

const userRateLimitMap = new Map<string, number[]>();
const ipRateLimitMap = new Map<string, number[]>();

// Per-endpoint rate limits
const endpointLimits: Record<string, RateLimitConfig> = {
  'fetch-news': { userLimit: 5, ipLimit: 20, windowMs: 60000 },
  'analyze-news': { userLimit: 20, ipLimit: 40, windowMs: 60000 },
  'translate-article': { userLimit: 20, ipLimit: 40, windowMs: 60000 },
  'ai-search-news': { userLimit: 8, ipLimit: 20, windowMs: 60000 },
  'fetch-related-news': { userLimit: 10, ipLimit: 25, windowMs: 60000 },
  'admin-get-users': { userLimit: 10, ipLimit: 10, windowMs: 60000 },
  'fetch-personalized-feed': { userLimit: 10, ipLimit: 20, windowMs: 60000 },
};

function checkLimit(
  map: Map<string, number[]>,
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const requests = map.get(key) || [];
  
  // Filter out old requests outside the time window
  const recentRequests = requests.filter(time => now - time < windowMs);
  
  if (recentRequests.length >= limit) {
    return { allowed: false, remaining: 0 };
  }
  
  // Add current request
  recentRequests.push(now);
  map.set(key, recentRequests);
  
  return { allowed: true, remaining: limit - recentRequests.length };
}

export function applyRateLimit(
  userId: string | null,
  clientIP: string,
  endpointName: string
): { allowed: boolean; error?: string; remaining: number } {
  const config = endpointLimits[endpointName] || {
    userLimit: 10,
    ipLimit: 20,
    windowMs: 60000,
  };

  // Check IP-level rate limit first
  const ipResult = checkLimit(ipRateLimitMap, clientIP, config.ipLimit, config.windowMs);
  if (!ipResult.allowed) {
    return {
      allowed: false,
      error: 'IP rate limit exceeded. Please try again later.',
      remaining: 0,
    };
  }

  // Check user-level rate limit if authenticated
  if (userId) {
    const userResult = checkLimit(userRateLimitMap, userId, config.userLimit, config.windowMs);
    if (!userResult.allowed) {
      return {
        allowed: false,
        error: 'User rate limit exceeded. Please try again later.',
        remaining: 0,
      };
    }
    return { allowed: true, remaining: userResult.remaining };
  }

  return { allowed: true, remaining: ipResult.remaining };
}

// Cleanup old entries periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  const maxWindowMs = Math.max(...Object.values(endpointLimits).map(c => c.windowMs));
  
  for (const [key, times] of userRateLimitMap.entries()) {
    const recent = times.filter(time => now - time < maxWindowMs);
    if (recent.length === 0) {
      userRateLimitMap.delete(key);
    } else {
      userRateLimitMap.set(key, recent);
    }
  }
  
  for (const [key, times] of ipRateLimitMap.entries()) {
    const recent = times.filter(time => now - time < maxWindowMs);
    if (recent.length === 0) {
      ipRateLimitMap.delete(key);
    } else {
      ipRateLimitMap.set(key, recent);
    }
  }
}, 300000); // Clean up every 5 minutes
