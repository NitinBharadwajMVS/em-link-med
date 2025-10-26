export type TriageLevel = 'critical' | 'urgent' | 'stable';

export interface Vitals {
  spo2: number;
  heartRate: number;
  bloodPressureSys: number;
  bloodPressureDia: number;
  temperature: number;
  gcs: number;
  respiratoryRate?: number;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  contact: string;
  vitals: Vitals;
  complaint: string;
  triageLevel: TriageLevel;
  medicalHistory?: string[];
  previousVisits?: {
    date: string;
    hospital: string;
    diagnosis: string;
  }[];
  timestamp: string;
}

export interface Hospital {
  id: string;
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  address: string;
  contact: string;
  equipment: string[];
  status: 'available' | 'unavailable';
}

export interface Alert {
  id: string;
  patient: Patient;
  ambulanceId: string;
  ambulanceContact: string;
  ambulanceEquipment: string[];
  ambulancePosition?: {
    lat: number;
    lng: number;
  };
  eta: number;
  distance: number;
  status: 'pending' | 'acknowledged' | 'accepted' | 'declined';
  hospitalId: string;
  route?: [number, number][]; // [lng, lat] pairs
  timestamp: string;
}
