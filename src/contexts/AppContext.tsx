import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Patient, Alert, Hospital, AuditLog } from '@/types/patient';
import hospitalsData from '@/data/hospitals_bangalore.json';

interface AppContextType {
  patients: Patient[];
  alerts: Alert[];
  hospitals: Hospital[];
  currentUser: string | null;
  addPatient: (patient: Patient) => void;
  sendAlert: (patient: Patient, ambulanceId: string, hospitalId: string, requiredEquipment?: string[]) => Hospital;
  updateAlertStatus: (alertId: string, status: 'acknowledged' | 'accepted' | 'declined', declineReason?: string) => void;
  completeCase: (alertId: string) => void;
  changeHospital: (alertId: string, newHospitalId: string, reason: string) => void;
  markHospitalUnavailable: (alertId: string, hospitalId: string, reason: string) => void;
  login: (userId: string) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const mockHospitals: Hospital[] = hospitalsData as Hospital[];

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

  const sendAlert = (
    patient: Patient,
    ambulanceId: string,
    hospitalId: string,
    requiredEquipment?: string[]
  ): Hospital => {
    const selectedHospital = hospitals.find((h) => h.id === hospitalId);
    if (!selectedHospital) {
      throw new Error('Hospital not found');
    }

    const newAlert: Alert = {
      id: `A${Date.now()}`,
      patient,
      ambulanceId,
      eta: Math.floor(Math.random() * 15) + 5,
      status: 'pending',
      hospitalId: selectedHospital.id,
      timestamp: new Date().toISOString(),
      requiredEquipment,
      auditLog: [
        {
          timestamp: new Date().toISOString(),
          action: 'Pre-alert sent',
          actor: ambulanceId,
          details: `Sent to ${selectedHospital.name}`,
        },
      ],
    };
    setAlerts((prev) => [...prev, newAlert]);
    return selectedHospital;
  };

  const updateAlertStatus = (
    alertId: string,
    status: 'acknowledged' | 'accepted' | 'declined',
    declineReason?: string
  ) => {
    setAlerts((prev) =>
      prev.map((alert) => {
        if (alert.id !== alertId) return alert;

        const hospital = hospitals.find((h) => h.id === alert.hospitalId);
        const newLog: AuditLog = {
          timestamp: new Date().toISOString(),
          action: status === 'declined' ? 'Alert declined' : `Alert ${status}`,
          actor: hospital?.name || alert.hospitalId,
          details: declineReason || `Status updated to ${status}`,
        };

        return {
          ...alert,
          status,
          declineReason: status === 'declined' ? declineReason : alert.declineReason,
          auditLog: [...alert.auditLog, newLog],
        };
      })
    );
  };

  const completeCase = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) => {
        if (alert.id !== alertId) return alert;

        const newLog: AuditLog = {
          timestamp: new Date().toISOString(),
          action: 'Patient dropped',
          actor: alert.ambulanceId,
          details: 'Patient successfully dropped at hospital',
        };

        return {
          ...alert,
          status: 'completed' as const,
          completedAt: new Date().toISOString(),
          auditLog: [...alert.auditLog, newLog],
        };
      })
    );
  };

  const changeHospital = (alertId: string, newHospitalId: string, reason: string) => {
    setAlerts((prev) =>
      prev.map((alert) => {
        if (alert.id !== alertId) return alert;

        const oldHospital = hospitals.find((h) => h.id === alert.hospitalId);
        const newHospital = hospitals.find((h) => h.id === newHospitalId);

        const newLog: AuditLog = {
          timestamp: new Date().toISOString(),
          action: 'Hospital changed',
          actor: alert.ambulanceId,
          details: `Changed from ${oldHospital?.name} to ${newHospital?.name}. Reason: ${reason}`,
        };

        return {
          ...alert,
          hospitalId: newHospitalId,
          previousHospitalIds: [...(alert.previousHospitalIds || []), alert.hospitalId],
          status: 'pending' as const, // Reset to pending for new hospital
          auditLog: [...alert.auditLog, newLog],
        };
      })
    );
  };

  const markHospitalUnavailable = (alertId: string, hospitalId: string, reason: string) => {
    const alert = alerts.find((a) => a.id === alertId);
    if (!alert) return;

    // Mark hospital as unavailable for this alert
    setAlerts((prev) =>
      prev.map((a) => {
        if (a.id !== alertId) return a;

        const hospital = hospitals.find((h) => h.id === hospitalId);
        const newLog: AuditLog = {
          timestamp: new Date().toISOString(),
          action: 'Hospital marked unavailable',
          actor: hospital?.name || hospitalId,
          details: reason,
        };

        return {
          ...a,
          auditLog: [...a.auditLog, newLog],
        };
      })
    );

    // Update hospital unavailability (this would need a more sophisticated state management)
    // For now, we're just logging it in the audit
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
        completeCase,
        changeHospital,
        markHospitalUnavailable,
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
