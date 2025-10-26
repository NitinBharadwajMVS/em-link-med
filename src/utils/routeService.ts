const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjQ4NjhlN2JhZTA1MTQwZDNhMDdiMjY0MmIzYWZiM2YwIiwiaCI6Im11cm11cjY0In0=';
const ORS_BASE_URL = 'https://api.openrouteservice.org/v2';

export interface RouteResult {
  distance: number; // in meters
  duration: number; // in seconds
  coordinates: [number, number][]; // [lng, lat] pairs for polyline
}

export async function calculateRoute(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
): Promise<RouteResult> {
  try {
    const response = await fetch(`${ORS_BASE_URL}/directions/driving-car`, {
      method: 'POST',
      headers: {
        'Authorization': ORS_API_KEY,
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
      throw new Error('Failed to calculate route');
    }

    const data = await response.json();
    const route = data.routes[0];

    return {
      distance: route.summary.distance,
      duration: route.summary.duration,
      coordinates: route.geometry.coordinates,
    };
  } catch (error) {
    console.error('Route calculation error:', error);
    // Fallback to straight-line distance calculation
    const distance = calculateStraightLineDistance(start, end);
    const estimatedDuration = (distance / 1000) * 120; // Rough estimate: 2 minutes per km
    
    return {
      distance: distance,
      duration: estimatedDuration,
      coordinates: [
        [start.lng, start.lat],
        [end.lng, end.lat],
      ],
    };
  }
}

function calculateStraightLineDistance(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (start.lat * Math.PI) / 180;
  const φ2 = (end.lat * Math.PI) / 180;
  const Δφ = ((end.lat - start.lat) * Math.PI) / 180;
  const Δλ = ((end.lng - start.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
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
