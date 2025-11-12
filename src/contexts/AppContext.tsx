import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Patient, Alert, Hospital, AuditLog } from '@/types/patient';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface AppContextType {
  patients: Patient[];
  alerts: Alert[];
  hospitals: Hospital[];
  currentUser: { id: string; username: string; role: string; linkedEntity: string | null } | null;
  currentHospitalId: string | null;
  currentAmbulanceId: string | null;
  addPatient: (patient: Patient) => Promise<string>;
  updatePatient: (patientId: string, updates: Partial<Patient>) => Promise<void>;
  sendAlert: (patientId: string, ambulanceId: string, hospitalId: string, distance?: number, eta?: number, requiredEquipment?: string[]) => Promise<Hospital>;
  updateAlertStatus: (alertId: string, status: 'acknowledged' | 'accepted' | 'declined', declineReason?: string) => Promise<void>;
  completeCase: (alertId: string) => Promise<void>;
  changeHospital: (patientId: string, newHospitalId: string, reason: string) => Promise<void>;
  markHospitalUnavailable: (alertId: string, hospitalId: string, reason: string) => Promise<void>;
  addHospital: (hospital: Hospital) => Promise<void>;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; role: string; linkedEntity: string | null } | null>(null);
  const [currentHospitalId, setCurrentHospitalId] = useState<string | null>(null);
  const [currentAmbulanceId, setCurrentAmbulanceId] = useState<string | null>(null);
  const [alertsChannel, setAlertsChannel] = useState<RealtimeChannel | null>(null);

  // Load hospitals from Supabase
  useEffect(() => {
    const loadHospitals = async () => {
      const { data, error } = await supabase.from('hospitals').select('*').order('name');
      if (error) {
        console.error('Error loading hospitals:', error);
      } else if (data) {
        setHospitals(data as Hospital[]);
      }
    };
    loadHospitals();
  }, []);

  // Load alerts from Supabase
  useEffect(() => {
    const loadAlerts = async () => {
      if (!currentUser) return;

      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error loading alerts:', error);
      } else if (data) {
        setAlerts(data.map(alert => ({
          id: alert.id,
          patient: {
            id: alert.id,
            name: alert.patient_name,
            age: alert.patient_age || 0,
            gender: alert.patient_gender as 'male' | 'female' | 'other',
            contact: alert.patient_contact || '',
            complaint: alert.patient_complaint || '',
            vitals: alert.vitals as any,
            triageLevel: alert.triage_level as any,
            timestamp: alert.timestamp
          },
          ambulanceId: alert.ambulance_id,
          hospitalId: alert.hospital_id,
          eta: alert.eta || 0,
          status: alert.status as any,
          timestamp: alert.timestamp,
          completedAt: alert.completed_at || undefined,
          requiredEquipment: alert.required_equipment || [],
          declineReason: alert.decline_reason || undefined,
          previousHospitalIds: alert.previous_hospital_ids || [],
          auditLog: (alert.audit_log as any) || []
        })));
      }
    };

    loadAlerts();
  }, [currentUser]);

  // Set up realtime subscription for alerts
  useEffect(() => {
    if (!currentUser || !currentHospitalId) return;

    console.log('Setting up realtime for hospital:', currentHospitalId);

    const channel = supabase
      .channel('alerts-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alerts',
          filter: `hospital_id=eq.${currentHospitalId}`
        },
        (payload) => {
          console.log('Realtime alert update:', payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const alert = payload.new;
            const mappedAlert: Alert = {
              id: alert.id,
              patient: {
                id: alert.id,
                name: alert.patient_name,
                age: alert.patient_age || 0,
                gender: alert.patient_gender as 'male' | 'female' | 'other',
                contact: alert.patient_contact || '',
                complaint: alert.patient_complaint || '',
                vitals: alert.vitals as any,
                triageLevel: alert.triage_level as any,
                timestamp: alert.timestamp
              },
              ambulanceId: alert.ambulance_id,
              hospitalId: alert.hospital_id,
              eta: alert.eta || 0,
              status: alert.status as any,
              timestamp: alert.timestamp,
              completedAt: alert.completed_at || undefined,
              requiredEquipment: alert.required_equipment || [],
              declineReason: alert.decline_reason || undefined,
              previousHospitalIds: alert.previous_hospital_ids || [],
              auditLog: (alert.audit_log as any) || []
            };

            setAlerts(prev => {
              const index = prev.findIndex(a => a.id === mappedAlert.id);
              if (index >= 0) {
                const updated = [...prev];
                updated[index] = mappedAlert;
                return updated;
              }
              return [mappedAlert, ...prev];
            });
          }
        }
      )
      .subscribe();

    setAlertsChannel(channel);

    return () => {
      channel.unsubscribe();
    };
  }, [currentUser, currentHospitalId]);

  const addPatient = async (patient: Patient): Promise<string> => {
    const { data, error } = await supabase.from('patients').insert({
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      contact: patient.contact,
      complaint: patient.complaint,
      triage_level: patient.triageLevel,
      vitals: patient.vitals as any,
      medical_history: patient.medicalHistory || [],
      current_hospital_id: null,
      ambulance_id: currentAmbulanceId
    }).select('id').single();

    if (error) {
      console.error('Error adding patient:', error);
      throw error;
    }

    return data.id;
  };

  const updatePatient = async (patientId: string, updates: Partial<Patient>) => {
    const updateData: any = {};
    if (updates.complaint) updateData.complaint = updates.complaint;
    if (updates.triageLevel) updateData.triage_level = updates.triageLevel;
    if (updates.vitals) updateData.vitals = updates.vitals;
    if (updates.medicalHistory) updateData.medical_history = updates.medicalHistory;

    const { error } = await supabase
      .from('patients')
      .update(updateData)
      .eq('id', patientId);

    if (error) {
      console.error('Error updating patient:', error);
      throw error;
    }
  };

  const sendAlert = async (
    patientId: string,
    ambulanceId: string,
    hospitalId: string,
    distance?: number,
    eta?: number,
    requiredEquipment?: string[]
  ): Promise<Hospital> => {
    const selectedHospital = hospitals.find((h) => h.id === hospitalId);
    if (!selectedHospital) {
      throw new Error('Hospital not found');
    }

    // Update patient's current hospital
    await supabase
      .from('patients')
      .update({ current_hospital_id: hospitalId })
      .eq('id', patientId);

    // Get patient data for alert
    const { data: patientData } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single();

    const alertId = `A${Date.now()}`;
    const auditLog = [
      {
        timestamp: new Date().toISOString(),
        action: 'Pre-alert sent',
        actor: ambulanceId,
        details: `Sent to ${selectedHospital.name}`,
      },
    ];

    const { error } = await supabase.from('alerts').insert({
      id: alertId,
      patient_id: patientId,
      hospital_id: hospitalId,
      ambulance_id: ambulanceId,
      patient_name: patientData?.name || '',
      patient_age: patientData?.age || 0,
      patient_gender: patientData?.gender || 'other',
      patient_contact: patientData?.contact || '',
      patient_complaint: patientData?.complaint || '',
      triage_level: patientData?.triage_level || 'stable',
      vitals: patientData?.vitals || {},
      distance: distance || null,
      eta: eta || null,
      status: 'pending',
      required_equipment: requiredEquipment || [],
      audit_log: auditLog as any,
      timestamp: new Date().toISOString()
    });

    if (error) {
      console.error('Error sending alert:', error);
      throw error;
    }

    return selectedHospital;
  };

  const updateAlertStatus = async (
    alertId: string,
    status: 'acknowledged' | 'accepted' | 'declined',
    declineReason?: string
  ) => {
    const alert = alerts.find(a => a.id === alertId);
    if (!alert) return;

    const hospital = hospitals.find((h) => h.id === alert.hospitalId);
    const newLog: AuditLog = {
      timestamp: new Date().toISOString(),
      action: status === 'declined' ? 'Alert declined' : `Alert ${status}`,
      actor: hospital?.name || alert.hospitalId,
      details: declineReason || `Status updated to ${status}`,
    };

    const updatedAuditLog = [...alert.auditLog, newLog];

    const { error } = await supabase
      .from('alerts')
      .update({
        status,
        decline_reason: status === 'declined' ? declineReason : null,
        audit_log: updatedAuditLog as any
      })
      .eq('id', alertId);

    if (error) {
      console.error('Error updating alert status:', error);
      throw error;
    }
  };

  const completeCase = async (alertId: string) => {
    const alert = alerts.find(a => a.id === alertId);
    if (!alert) return;

    const newLog: AuditLog = {
      timestamp: new Date().toISOString(),
      action: 'Patient dropped',
      actor: alert.ambulanceId,
      details: 'Patient successfully dropped at hospital',
    };

    const updatedAuditLog = [...alert.auditLog, newLog];

    const { error } = await supabase
      .from('alerts')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        audit_log: updatedAuditLog as any
      })
      .eq('id', alertId);

    if (error) {
      console.error('Error completing case:', error);
      throw error;
    }
  };

  const changeHospital = async (patientId: string, newHospitalId: string, reason: string) => {
    // Update patient's current hospital - trigger will handle alert updates
    const { error } = await supabase
      .from('patients')
      .update({ current_hospital_id: newHospitalId })
      .eq('id', patientId);

    if (error) {
      console.error('Error changing hospital:', error);
      throw error;
    }
  };

  const markHospitalUnavailable = async (alertId: string, hospitalId: string, reason: string) => {
    const alert = alerts.find((a) => a.id === alertId);
    if (!alert) return;

    const hospital = hospitals.find((h) => h.id === hospitalId);
    const newLog: AuditLog = {
      timestamp: new Date().toISOString(),
      action: 'Hospital marked unavailable',
      actor: hospital?.name || hospitalId,
      details: reason,
    };

    const updatedAuditLog = [...alert.auditLog, newLog];

    const { error } = await supabase
      .from('alerts')
      .update({
        audit_log: updatedAuditLog as any
      })
      .eq('id', alertId);

    if (error) {
      console.error('Error marking hospital unavailable:', error);
      throw error;
    }
  };

  const login = async (usernameOrEmail: string, password: string) => {
    // Map username to email if needed
    const email = usernameOrEmail.includes('@') 
      ? usernameOrEmail 
      : `${usernameOrEmail.toLowerCase()}@internal.example`;

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      throw authError;
    }

    if (!authData.user) {
      throw new Error('Login failed');
    }

    // Get user info from app_users table
    const { data: appUser, error: appUserError } = await supabase
      .from('app_users')
      .select('*')
      .eq('auth_uid', authData.user.id)
      .single();

    if (appUserError || !appUser) {
      console.error('Error loading user info:', appUserError);
      throw new Error('User not found');
    }

    setCurrentUser({
      id: authData.user.id,
      username: appUser.username,
      role: appUser.role,
      linkedEntity: appUser.linked_entity
    });

    if (appUser.role === 'hospital') {
      setCurrentHospitalId(appUser.linked_entity);
    } else if (appUser.role === 'ambulance') {
      setCurrentAmbulanceId(appUser.linked_entity);
    }
  };

  const addHospital = async (hospital: Hospital) => {
    const { error } = await supabase.from('hospitals').insert({
      id: hospital.id,
      name: hospital.name,
      distance: hospital.distance,
      latitude: hospital.latitude,
      longitude: hospital.longitude,
      address: hospital.address,
      contact: hospital.contact,
      equipment: hospital.equipment || [],
      specialties: hospital.specialties || []
    });

    if (error) {
      console.error('Error adding hospital:', error);
      throw error;
    }

    setHospitals((prev) => [...prev, hospital]);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setCurrentHospitalId(null);
    setCurrentAmbulanceId(null);
    if (alertsChannel) {
      alertsChannel.unsubscribe();
    }
  };

  return (
    <AppContext.Provider
      value={{
        patients,
        alerts,
        hospitals,
        currentUser,
        currentHospitalId,
        currentAmbulanceId,
        addPatient,
        updatePatient,
        sendAlert,
        updateAlertStatus,
        completeCase,
        changeHospital,
        markHospitalUnavailable,
        addHospital,
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
