// Re-export functions from gsc-jwt-auth.ts
export {
  getIntegrationWithValidToken,
  fetchGSCProperties,
  validateServiceAccountJSON,
  getAccessToken,
  markIntegrationUnhealthy,
  markIntegrationHealthy,
  isAuthError,
} from "./gsc-jwt-auth.ts";
