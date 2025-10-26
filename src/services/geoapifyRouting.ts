import { GEOAPIFY_CONFIG } from '@/config/geoapify';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface RouteResult {
  distance: number; // in meters
  duration: number; // in seconds
  coordinates: [number, number][]; // [lng, lat] pairs for polyline
}

export interface HospitalWithRoute {
  id: string;
  name: string;
  coordinates: Coordinates;
  contact: string;
  equipment: string[];
  distance: number;
  eta: number; // in minutes
  route?: RouteResult;
}

export async function calculateRoute(
  start: Coordinates,
  end: Coordinates
): Promise<RouteResult | null> {
  try {
    const url = `${GEOAPIFY_CONFIG.baseUrl}?waypoints=${start.lat},${start.lng}|${end.lat},${end.lng}&mode=drive&apiKey=${GEOAPIFY_CONFIG.apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn('Geoapify routing failed:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (!data.features || data.features.length === 0) {
      console.warn('No route found');
      return null;
    }

    const feature = data.features[0];
    const props = feature.properties;
    
    return {
      distance: props.distance || 0,
      duration: props.time || 0,
      coordinates: feature.geometry.coordinates[0] || [],
    };
  } catch (error) {
    console.error('Route calculation error:', error);
    return null;
  }
}

export async function calculateRoutesToHospitals(
  ambulancePosition: Coordinates,
  hospitals: Omit<HospitalWithRoute, 'distance' | 'eta' | 'route'>[]
): Promise<HospitalWithRoute[]> {
  const results = await Promise.all(
    hospitals.map(async (hospital) => {
      const route = await calculateRoute(ambulancePosition, hospital.coordinates);
      
      if (!route) {
        return {
          ...hospital,
          distance: 999999,
          eta: 999,
          route: undefined,
        };
      }

      return {
        ...hospital,
        distance: route.distance,
        eta: Math.ceil(route.duration / 60), // convert to minutes
        route,
      };
    })
  );

  // Sort by ETA
  return results.sort((a, b) => a.eta - b.eta);
}

export function isWithinRadius(
  point1: Coordinates,
  point2: Coordinates,
  radiusMeters: number
): boolean {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (point1.lat * Math.PI) / 180;
  const φ2 = (point2.lat * Math.PI) / 180;
  const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
  const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;
  return distance <= radiusMeters;
}
