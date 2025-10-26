import { API_CONFIG } from '@/config/api';

export interface RouteResult {
  distance: number; // in meters
  duration: number; // in seconds
  coordinates: [number, number][]; // [lng, lat] pairs for polyline
}

export async function calculateRoute(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
): Promise<RouteResult> {
  // Validate input coordinates
  if (!isValidCoordinate(start) || !isValidCoordinate(end)) {
    console.warn('Invalid coordinates provided to calculateRoute', { start, end });
    throw new Error('Invalid coordinates');
  }

  try {
    const response = await fetch(`${API_CONFIG.openRouteService.baseUrl}/directions/driving-car`, {
      method: 'POST',
      headers: {
        'Authorization': API_CONFIG.openRouteService.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        coordinates: [
          [start.lng, start.lat],
          [end.lng, end.lat],
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.warn('ORS API error:', response.status, errorText);
      throw new Error(`Route API returned ${response.status}`);
    }

    const data = await response.json();
    
    // Validate response structure
    if (!data?.routes?.[0]?.summary || !data?.routes?.[0]?.geometry?.coordinates) {
      console.warn('Invalid route response structure', data);
      throw new Error('Invalid route data received');
    }

    const route = data.routes[0];

    return {
      distance: route.summary.distance,
      duration: route.summary.duration,
      coordinates: route.geometry.coordinates,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.warn('Route calculation failed, using fallback:', errorMessage);
    
    // Fallback to straight-line distance calculation
    const distance = calculateStraightLineDistance(start, end);
    const estimatedDuration = (distance / 1000) * 120; // Rough estimate: 2 minutes per km
    
    return {
      distance,
      duration: estimatedDuration,
      coordinates: [
        [start.lng, start.lat],
        [end.lng, end.lat],
      ],
    };
  }
}

// Validate coordinate object
function isValidCoordinate(coord: { lat: number; lng: number }): boolean {
  return (
    coord &&
    typeof coord.lat === 'number' &&
    typeof coord.lng === 'number' &&
    coord.lat >= -90 &&
    coord.lat <= 90 &&
    coord.lng >= -180 &&
    coord.lng <= 180
  );
}

// Calculate straight-line distance using Haversine formula
function calculateStraightLineDistance(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
): number {
  const EARTH_RADIUS_METERS = 6371e3;
  
  // Convert degrees to radians
  const startLatRad = (start.lat * Math.PI) / 180;
  const endLatRad = (end.lat * Math.PI) / 180;
  const latDifferenceRad = ((end.lat - start.lat) * Math.PI) / 180;
  const lngDifferenceRad = ((end.lng - start.lng) * Math.PI) / 180;

  // Haversine formula
  const haversineA =
    Math.sin(latDifferenceRad / 2) * Math.sin(latDifferenceRad / 2) +
    Math.cos(startLatRad) * Math.cos(endLatRad) *
    Math.sin(lngDifferenceRad / 2) * Math.sin(lngDifferenceRad / 2);
  const haversineC = 2 * Math.atan2(Math.sqrt(haversineA), Math.sqrt(1 - haversineA));

  return EARTH_RADIUS_METERS * haversineC;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}
