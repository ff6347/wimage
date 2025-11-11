// ABOUTME: CORS validation and rate limiting helper for API endpoints
// ABOUTME: Validates that requests come from the same origin and enforces rate limits

const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute

export function validateOrigin(request: Request): boolean {
	const origin = request.headers.get("origin");
	const referer = request.headers.get("referer");

	// If no origin or referer, reject (likely direct API call)
	if (!origin && !referer) {
		return false;
	}

	const requestUrl = new URL(request.url);
	const expectedHost = requestUrl.host;

	// Check origin
	if (origin) {
		const originUrl = new URL(origin);
		if (originUrl.host !== expectedHost) {
			return false;
		}
	}

	// Check referer
	if (referer) {
		const refererUrl = new URL(referer);
		if (refererUrl.host !== expectedHost) {
			return false;
		}
	}

	return true;
}

export function checkRateLimit(clientId: string): boolean {
	const now = Date.now();
	const cutoff = now - RATE_LIMIT_WINDOW;

	// Get existing requests for this client
	let requests = rateLimitMap.get(clientId) || [];

	// Remove requests older than the window
	requests = requests.filter(timestamp => timestamp > cutoff);

	// Check if limit exceeded
	if (requests.length >= MAX_REQUESTS_PER_WINDOW) {
		return false;
	}

	// Add current request
	requests.push(now);
	rateLimitMap.set(clientId, requests);

	// Clean up old entries every 100 clients
	if (rateLimitMap.size > 100) {
		for (const [id, timestamps] of rateLimitMap.entries()) {
			const recentRequests = timestamps.filter(t => t > cutoff);
			if (recentRequests.length === 0) {
				rateLimitMap.delete(id);
			} else {
				rateLimitMap.set(id, recentRequests);
			}
		}
	}

	return true;
}

export function getClientId(request: Request): string {
	// Use IP address as client identifier
	const forwarded = request.headers.get("x-forwarded-for");
	const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

	// Combine IP with endpoint path for per-endpoint rate limiting
	const url = new URL(request.url);
	return `${ip}:${url.pathname}`;
}

export function createCorsErrorResponse(): Response {
	return new Response(
		JSON.stringify({ error: "Invalid origin" }),
		{ status: 403, headers: { "Content-Type": "application/json" } }
	);
}

export function createRateLimitErrorResponse(): Response {
	return new Response(
		JSON.stringify({ error: "Rate limit exceeded. Maximum 10 requests per minute allowed." }),
		{
			status: 429,
			headers: {
				"Content-Type": "application/json",
				"Retry-After": "60"
			}
		}
	);
}
