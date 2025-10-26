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
  // Assume average speed of 30 km/h in Bangalore traffic
  const hours = distance / 30;
  const minutes = Math.ceil(hours * 60);
  return Math.max(3, minutes); // Minimum 3 minutes
};

// Sort hospitals by distance and availability
export const sortHospitalsByPreference = (
  hospitals: Hospital[],
  alertId?: string
): Hospital[] => {
  return [...hospitals]
    .filter((h) => !h.unavailableForAlert || h.unavailableForAlert !== alertId)
    .sort((a, b) => a.distance - b.distance);
};

// Deterministic fallback recommendation logic with ambulance location
export const getFallbackRecommendation = (
  hospitals: Hospital[],
  ambulanceLocation: { latitude: number; longitude: number },
  requiredEquipment?: string[],
  maxRadius: number = 5
): Hospital[] => {
  return [...hospitals]
    .map(hospital => {
      // Recalculate distance from ambulance location
      const actualDistance = calculateDistance(
        ambulanceLocation.latitude,
        ambulanceLocation.longitude,
        hospital.latitude,
        hospital.longitude
      );
      
      const equipmentMatch = hasRequiredEquipment(hospital, requiredEquipment);
      const equipmentScore = equipmentMatch.hasAll ? 100 : 
        Math.max(0, 100 - (equipmentMatch.missing.length * 20));
      
      // Distance score (closer is better, max 50 points)
      const distanceScore = Math.max(0, 50 - actualDistance * 2);
      
      // Penalize hospitals beyond maxRadius unless they're the only equipment match
      const radiusPenalty = actualDistance > maxRadius && !equipmentMatch.hasAll ? 0.5 : 1;
      
      const totalScore = (equipmentScore * 0.7 + distanceScore * 0.3) * radiusPenalty;
      
      return {
        ...hospital,
        distance: actualDistance,
        score: Math.round(totalScore),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
};

// Check if hospital has required equipment
export const hasRequiredEquipment = (
  hospital: Hospital,
  requiredEquipment?: string[]
): { hasAll: boolean; missing: string[] } => {
  if (!requiredEquipment || requiredEquipment.length === 0) {
    return { hasAll: true, missing: [] };
  }
  
  const hospitalEquipment = hospital.equipment || [];
  const missing = requiredEquipment.filter(
    (eq) => !hospitalEquipment.includes(eq)
  );
  
  return {
    hasAll: missing.length === 0,
    missing,
  };
};
