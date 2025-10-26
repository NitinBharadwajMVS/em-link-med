import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Patient, Alert, Hospital } from '@/types/patient';

interface AppContextType {
  patients: Patient[];
  alerts: Alert[];
  hospitals: Hospital[];
  currentUser: string | null;
  addPatient: (patient: Patient) => void;
  sendAlert: (patient: Patient, ambulanceId: string) => Hospital;
  updateAlertStatus: (alertId: string, status: 'acknowledged' | 'accepted') => void;
  login: (userId: string) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const mockHospitals: Hospital[] = [
  { id: '1', name: 'CityCare Hospital', distance: 1.4, address: '123 Main St' },
  { id: '2', name: 'General Medical Center', distance: 1.8, address: '456 Oak Ave' },
  { id: '3', name: 'Emergency Care Unit', distance: 2.1, address: '789 Pine Rd' },
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
  const [hospitals] = useState<Hospital[]>(mockHospitals);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  const addPatient = (patient: Patient) => {
    setPatients((prev) => [...prev, patient]);
  };

  const sendAlert = (patient: Patient, ambulanceId: string): Hospital => {
    const nearestHospital = hospitals[Math.floor(Math.random() * hospitals.length)];
    const newAlert: Alert = {
      id: `A${Date.now()}`,
      patient,
      ambulanceId,
      eta: Math.floor(Math.random() * 15) + 5,
      status: 'pending',
      hospitalId: nearestHospital.id,
      timestamp: new Date().toISOString(),
    };
    setAlerts((prev) => [...prev, newAlert]);
    return nearestHospital;
  };

  const updateAlertStatus = (alertId: string, status: 'acknowledged' | 'accepted') => {
    setAlerts((prev) =>
      prev.map((alert) => (alert.id === alertId ? { ...alert, status } : alert))
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
