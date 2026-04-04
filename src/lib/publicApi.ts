/** Shared API origin parsing so REST and Socket.IO stay in sync with .env */
export function getRestApiBase(): string {
  const rawUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const clean = rawUrl.replace(/\/$/, "");
  return clean.endsWith("/api") ? clean : `${clean}/api`;
}

/** Socket server origin (no /api path) */
export function getSocketOrigin(): string {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL.replace(/\/$/, "");
  }
  const apiBase = getRestApiBase();
  return apiBase.replace(/\/api$/, "");
}
