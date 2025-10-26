import { Hospital } from '@/types/patient';

// Haversine formula to calculate distance between two coordinates
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // Round to 1 decimal
};

// Mock ETA calculation based on distance
export const calculateETA = (distance: number): number => {
  if (!distance || isNaN(distance)) return 0;
  // Assume average speed of 40 km/h in Bangalore traffic
  const hours = distance / 40;
  const minutes = Math.ceil(hours * 60);
  return Math.max(3, minutes); // Minimum 3 minutes
};

// Sort hospitals by distance only
export const sortHospitalsByDistance = (
  hospitals: Hospital[],
  alertId?: string
): Hospital[] => {
  return [...hospitals]
    .filter((h) => !h.unavailableForAlert || h.unavailableForAlert !== alertId)
    .filter((h) => h.distance != null && !isNaN(h.distance))
    .sort((a, b) => a.distance - b.distance);
};

// Extract locality from full address (first part before comma)
export const getLocality = (address: string): string => {
  const parts = address.split(',');
  return parts[0]?.trim() || address;
};
