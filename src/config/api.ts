// API Configuration
// Centralized API keys and endpoints for easy management

export const API_CONFIG = {
  openRouteService: {
    apiKey: import.meta.env.VITE_ORS_API_KEY || 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjQ4NjhlN2JhZTA1MTQwZDNhMDdiMjY0MmIzYWZiM2YwIiwiaCI6Im11cm11cjY0In0=',
    baseUrl: 'https://api.openrouteservice.org/v2',
  },
} as const;

// Rate limiting configuration
export const RATE_LIMITS = {
  routeCalculation: {
    minInterval: 5000, // Minimum 5 seconds between route calculations
    maxRetries: 3,
  },
} as const;
