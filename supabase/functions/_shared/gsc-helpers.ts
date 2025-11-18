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

// Re-export functions from gsc-property-detector.ts
export {
  listAvailableGSCProperties,
  detectCorrectPropertyUrl,
  comparePropertyUrl,
} from "./gsc-property-detector.ts";
