// Shared by the Node server and release verification. No inline JavaScript.
export function securityHeaders({https=false}={}){
 const csp=[
  "default-src 'self'",
  "base-uri 'none'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "form-action 'none'",
  "script-src 'self' https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js",
  "script-src-attr 'none'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "worker-src 'self' blob:",
  "connect-src 'self' https://tile.openstreetmap.org https://*.tile.openstreetmap.org https://nominatim.openstreetmap.org https://api.open-meteo.com https://open.er-api.com",
  "manifest-src 'self'"
 ].join('; ');
 return {
  'Content-Security-Policy':csp,
  'X-Content-Type-Options':'nosniff',
  'X-Frame-Options':'DENY',
  'Referrer-Policy':'strict-origin-when-cross-origin',
  'Permissions-Policy':'camera=(), microphone=(), geolocation=(), payment=()',
  ...(https?{'Strict-Transport-Security':'max-age=31536000'}:{})
 };
}
