/**
 * CORS Middleware for API Routes
 * 
 * Allows frontend (Vercel) to make requests to backend (Render)
 * 
 * Permitted:
 * - Custom token headers (X-ADMIN-TOKEN, X-SCORER-TOKEN, X-PUBLIC-TOKEN)
 * - JSON content type
 * - GET, POST, PUT, DELETE, PATCH methods
 */

const ALLOWED_ORIGINS = [
  'https://game-count-system.onrender.com',
  'https://game-count-system.vercel.app',
  'https://game-count-system.onrender.com',
  // Add your custom domain here if needed
  // 'https://yourdomain.com',
];

export function corsHeaders(origin?: string | null) {
  // Check if origin is allowed
  const isAllowed = origin && ALLOWED_ORIGINS.includes(origin);
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-ADMIN-TOKEN, X-SCORER-TOKEN, X-PUBLIC-TOKEN',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

export function handleCors(request: Request) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  
  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers,
    });
  }
  
  return headers;
}
