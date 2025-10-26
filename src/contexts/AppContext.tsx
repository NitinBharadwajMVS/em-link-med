import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Patient, Alert, Hospital } from '@/types/patient';

interface AppContextType {
  patients: Patient[];
  alerts: Alert[];
  hospitals: Hospital[];
  currentUser: string | null;
  addPatient: (patient: Patient) => void;
  sendAlert: (patient: Patient, ambulanceId: string, ambulanceLocation?: { lat: number; lng: number }) => Hospital;
  updateAlertStatus: (alertId: string, status: 'acknowledged' | 'accepted' | 'rejected') => void;
  updateHospitalStatus: (hospitalId: string, canAccept: boolean) => void;
  login: (userId: string) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const mockHospitals: Hospital[] = [
  {
    id: '1',
    name: 'CityCare Hospital',
    distance: 1.4,
    address: '123 Main St',
    coordinates: { lat: 40.7580, lng: -73.9855 },
    phone: '+1-555-0101',
    capabilities: ['ICU', 'Trauma', 'Cardiology', 'Emergency'],
    canAccept: true,
    availableBeds: 12,
  },
  {
    id: '2',
    name: 'General Medical Center',
    distance: 1.8,
    address: '456 Oak Ave',
    coordinates: { lat: 40.7614, lng: -73.9776 },
    phone: '+1-555-0102',
    capabilities: ['Emergency', 'Pediatric', 'Surgery'],
    canAccept: true,
    availableBeds: 8,
  },
  {
    id: '3',
    name: 'Emergency Care Unit',
    distance: 2.1,
    address: '789 Pine Rd',
    coordinates: { lat: 40.7489, lng: -73.9680 },
    phone: '+1-555-0103',
    capabilities: ['Emergency', 'ICU', 'Burn Unit'],
    canAccept: false,
    availableBeds: 0,
  },
];

const mockPatients: Patient[] = [
  {
    id: 'P001',
    name: 'John Smith',
    age: 45,
    gender: 'male',
    contact: '+1234567890',
    vitals: {
      spo2: 95,
      heartRate: 85,
      bloodPressureSys: 130,
      bloodPressureDia: 85,
      temperature: 98.6,
      gcs: 15,
    },
    complaint: 'Chest pain',
    triageLevel: 'urgent',
    medicalHistory: ['Hypertension', 'Diabetes Type 2'],
    previousVisits: [
      {
        date: '2024-09-15',
        hospital: 'CityCare Hospital',
        diagnosis: 'Mild angina',
      },
    ],
    timestamp: new Date().toISOString(),
  },
];

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [patients, setPatients] = useState<Patient[]>(mockPatients);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>(mockHospitals);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  const addPatient = (patient: Patient) => {
    if (!patient || !patient.id) {
      console.warn('Invalid patient data:', patient);
      return;
    }
    setPatients((previousPatients) => [...previousPatients, patient]);
  };

  const sendAlert = (patient: Patient, ambulanceId: string, ambulanceLocation?: { lat: number; lng: number }): Hospital => {
    // Validate input data
    if (!patient || !ambulanceId) {
      console.warn('Invalid alert data:', { patient, ambulanceId });
      throw new Error('Invalid patient or ambulance data');
    }

    const availableHospitals = hospitals.filter(hospital => hospital.canAccept);
    const targetHospitals = availableHospitals.length > 0 ? availableHospitals : hospitals;
    
    if (targetHospitals.length === 0) {
      console.warn('No hospitals available');
      throw new Error('No hospitals available');
    }

    const nearestHospital = targetHospitals[Math.floor(Math.random() * targetHospitals.length)];
    
    const newAlert: Alert = {
      id: `A${Date.now()}`,
      patient,
      ambulanceId,
      eta: Math.floor(Math.random() * 15) + 5,
      status: 'pending',
      hospitalId: nearestHospital.id,
      timestamp: new Date().toISOString(),
      ambulanceLocation: ambulanceLocation || { lat: 40.7489, lng: -73.9876 },
      requiredEquipment: generateRequiredEquipment(patient),
    };
    
    setAlerts((previousAlerts) => [...previousAlerts, newAlert]);
    return nearestHospital;
  };

  const updateAlertStatus = (alertId: string, status: 'acknowledged' | 'accepted' | 'rejected') => {
    if (!alertId || !status) {
      console.warn('Invalid alert status update:', { alertId, status });
      return;
    }

    setAlerts((previousAlerts) =>
      previousAlerts.map((alert) => 
        alert.id === alertId ? { ...alert, status } : alert
      )
    );
  };

  const updateHospitalStatus = (hospitalId: string, canAccept: boolean) => {
    if (!hospitalId || typeof canAccept !== 'boolean') {
      console.warn('Invalid hospital status update:', { hospitalId, canAccept });
      return;
    }

    setHospitals((previousHospitals) =>
      previousHospitals.map((hospital) =>
        hospital.id === hospitalId ? { ...hospital, canAccept } : hospital
      )
    );
  };

  const generateRequiredEquipment = (patient: Patient): string[] => {
    const equipment: string[] = ['Stretcher', 'Oxygen'];
    
    if (patient.triageLevel === 'critical') {
      equipment.push('Defibrillator', 'Advanced Airway', 'IV Access');
    }
    
    if (patient.vitals.spo2 < 90) {
      equipment.push('Ventilator');
    }
    
    if (patient.complaint.toLowerCase().includes('chest')) {
      equipment.push('ECG Monitor', 'Cardiac Drugs');
    }
    
    return equipment;
  };

  const login = (userId: string) => {
    setCurrentUser(userId);
  };

  const logout = () => {
    setCurrentUser(null);
  };

  return (
    <AppContext.Provider
      value={{
        patients,
        alerts,
        hospitals,
        currentUser,
        addPatient,
        sendAlert,
        updateAlertStatus,
        updateHospitalStatus,
        login,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
