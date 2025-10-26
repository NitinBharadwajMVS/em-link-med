import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Patient, Alert, Hospital } from '@/types/patient';

interface AppContextType {
  patients: Patient[];
  alerts: Alert[];
  hospitals: Hospital[];
  currentUser: string | null;
  addPatient: (patient: Patient) => void;
  sendAlert: (alertData: Partial<Alert> & { patient: Patient; ambulanceId: string; hospitalId: string }) => void;
  updateAlertStatus: (alertId: string, status: 'acknowledged' | 'accepted' | 'declined') => void;
  updateHospitalStatus: (hospitalId: string, status: 'available' | 'unavailable') => void;
  login: (userId: string) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const mockHospitals: Hospital[] = [
  {
    id: '1',
    name: 'CityCare Hospital',
    coordinates: { lat: 40.7489, lng: -73.9680 },
    address: '123 Main St, New York, NY',
    contact: '+1-212-555-0100',
    equipment: ['CT Scanner', 'MRI', 'Trauma Unit', 'ICU'],
    status: 'available',
  },
  {
    id: '2',
    name: 'General Medical Center',
    coordinates: { lat: 40.7520, lng: -73.9700 },
    address: '456 Oak Ave, New York, NY',
    contact: '+1-212-555-0200',
    equipment: ['Emergency Room', 'Surgery', 'ICU', 'Lab'],
    status: 'available',
  },
  {
    id: '3',
    name: 'Emergency Care Unit',
    coordinates: { lat: 40.7450, lng: -73.9650 },
    address: '789 Pine Rd, New York, NY',
    contact: '+1-212-555-0300',
    equipment: ['Trauma Center', 'Burn Unit', 'ICU'],
    status: 'available',
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
    setPatients((prev) => [...prev, patient]);
  };

  const sendAlert = (alertData: Partial<Alert> & { patient: Patient; ambulanceId: string; hospitalId: string }) => {
    const newAlert: Alert = {
      id: `A${Date.now()}`,
      status: 'pending',
      timestamp: new Date().toISOString(),
      ambulanceContact: '+1-555-AMBULANCE',
      ambulanceEquipment: ['Defibrillator', 'Oxygen', 'Medications'],
      eta: 10,
      distance: 1500,
      ...alertData,
    };
    setAlerts((prev) => [...prev, newAlert]);
  };

  const updateAlertStatus = (alertId: string, status: 'acknowledged' | 'accepted' | 'declined') => {
    setAlerts((prev) =>
      prev.map((alert) => (alert.id === alertId ? { ...alert, status } : alert))
    );
  };

  const updateHospitalStatus = (hospitalId: string, status: 'available' | 'unavailable') => {
    setHospitals((prev) =>
      prev.map((hospital) => (hospital.id === hospitalId ? { ...hospital, status } : hospital))
    );
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
