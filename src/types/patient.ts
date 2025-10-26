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
  distance: number;
  address: string;
}

export interface Alert {
  id: string;
  patient: Patient;
  ambulanceId: string;
  eta: number;
  status: 'pending' | 'acknowledged' | 'accepted' | 'completed';
  hospitalId: string;
  timestamp: string;
  completedAt?: string;
}
