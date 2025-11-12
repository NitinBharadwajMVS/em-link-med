import { useState } from 'react';
import { Patient, TriageLevel, Vitals } from '@/types/patient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LiveVitalsDisplay } from './LiveVitalsDisplay';
import { MultipleSymptomDropdown } from './MultipleSymptomDropdown';
import { HospitalSelector } from './HospitalSelector';
import { useApp } from '@/contexts/AppContext';
import { Send } from 'lucide-react';
import { toast } from 'sonner';
import { calculateETA } from '@/utils/distanceCalculator';

interface PatientFormProps {
  triageLevel: TriageLevel;
  onClose: () => void;
}

export const PatientForm = ({ triageLevel, onClose }: PatientFormProps) => {
  const { patients, addPatient, sendAlert, currentUser, hospitals } = useApp();
  const [isNewPatient, setIsNewPatient] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('');
  const [requiredEquipment, setRequiredEquipment] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'male',
    contact: '',
    complaints: [] as string[],
  });
  const [vitals, setVitals] = useState<Vitals>({
    spo2: 98,
    heartRate: 72,
    bloodPressureSys: 120,
    bloodPressureDia: 80,
    temperature: 98.6,
    gcs: 15,
  });

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  const handleSendAlert = async () => {
    let patientData: Patient;

    if (isNewPatient) {
      if (!formData.name || !formData.age || formData.complaints.length === 0) {
        toast.error('Please fill all required fields');
        return;
      }

      patientData = {
        id: `P${Date.now()}`,
        name: formData.name,
        age: parseInt(formData.age),
        gender: formData.gender as 'male' | 'female' | 'other',
        contact: formData.contact,
        vitals,
        complaint: formData.complaints.join(', '),
        triageLevel,
        timestamp: new Date().toISOString(),
      };
      addPatient(patientData);
    } else {
      if (!selectedPatient) {
        toast.error('Please select a patient');
        return;
      }
      patientData = { ...selectedPatient, vitals, triageLevel };
    }

    if (!selectedHospitalId) {
      toast.error('Please select a hospital');
      return;
    }

    const selectedHospital = hospitals.find(h => h.id === selectedHospitalId);
    if (!selectedHospital) {
      toast.error('Hospital not found');
      return;
    }

    const ambulanceId = currentUser?.linkedEntity || 'amb-001';
    const distance = selectedHospital.distance || 0;
    const eta = calculateETA(distance);

    try {
      const hospital = await sendAlert(
        patientData,
        ambulanceId,
        selectedHospitalId,
        distance,
        eta,
        requiredEquipment.length > 0 ? requiredEquipment : undefined
      );
      
      toast.success(
        `Pre-alert sent to ${hospital.name}`,
        {
          description: `Distance: ${distance.toFixed(2)} km | ETA: ${eta} minutes`,
          duration: 5000,
        }
      );

      setTimeout(onClose, 1500);
    } catch (error) {
      console.error('Error sending alert:', error);
      toast.error('Failed to send pre-alert');
    }
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex gap-4">
        <Button
          variant={isNewPatient ? 'default' : 'outline'}
          onClick={() => setIsNewPatient(true)}
          className="flex-1 transition-all duration-300 hover:scale-105"
        >
          Add New Patient
        </Button>
        <Button
          variant={!isNewPatient ? 'default' : 'outline'}
          onClick={() => setIsNewPatient(false)}
          className="flex-1 transition-all duration-300 hover:scale-105"
        >
          Existing Patient
        </Button>
      </div>

      {!isNewPatient && (
        <div>
          <Label>Select Patient</Label>
          <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
            <SelectTrigger className="bg-ambulance-card border-ambulance-border">
              <SelectValue placeholder="Choose patient..." />
            </SelectTrigger>
            <SelectContent>
              {patients.map(patient => (
                <SelectItem key={patient.id} value={patient.id}>
                  {patient.name} - {patient.age}y - {patient.contact}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedPatient && (
            <div className="mt-4 p-4 glass-effect rounded-lg space-y-2 text-sm animate-slide-in interactive-card">
              <div><strong>Medical History:</strong> {selectedPatient.medicalHistory?.join(', ') || 'None'}</div>
              {selectedPatient.previousVisits && (
                <div>
                  <strong>Previous Visit:</strong> {selectedPatient.previousVisits[0].date} - {selectedPatient.previousVisits[0].hospital} - {selectedPatient.previousVisits[0].diagnosis}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {isNewPatient && (
        <div className="grid grid-cols-2 gap-4 animate-slide-in">
          <div>
            <Label>Name</Label>
            <Input
              className="bg-ambulance-card border-ambulance-border interactive-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <Label>Age</Label>
            <Input
              type="number"
              className="bg-ambulance-card border-ambulance-border interactive-input"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            />
          </div>
          <div>
            <Label>Gender</Label>
            <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
              <SelectTrigger className="bg-ambulance-card border-ambulance-border interactive-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Contact</Label>
            <Input
              className="bg-ambulance-card border-ambulance-border interactive-input"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
            />
          </div>
          <div className="col-span-2">
            <Label>Chief Complaints / Conditions (Multiple Selection)</Label>
            <MultipleSymptomDropdown
              values={formData.complaints}
              onChange={(values) => 
                setFormData({ ...formData, complaints: values })
              }
            />
          </div>
        </div>
      )}

      <div>
        <Label>Required Equipment (Optional)</Label>
        <MultipleSymptomDropdown
          values={requiredEquipment}
          onChange={setRequiredEquipment}
          options={['Ventilator', 'ICU', 'CT Scan', 'MRI', 'Oxygen', 'Defibrillator', 'Cardiac Monitor', 'Dialysis', 'Cath Lab']}
          placeholder="Select required equipment..."
        />
      </div>

      <HospitalSelector
        hospitals={hospitals}
        selectedHospitalId={selectedHospitalId}
        onSelect={(hospital) => setSelectedHospitalId(hospital.id)}
      />

      <LiveVitalsDisplay
        onVitalsUpdate={(spo2, heartRate) => {
          setVitals(v => ({ ...v, spo2, heartRate }));
        }}
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Blood Pressure (Sys/Dia)</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              className="bg-ambulance-card border-ambulance-border interactive-input"
              value={vitals.bloodPressureSys}
              onChange={(e) => setVitals({ ...vitals, bloodPressureSys: parseInt(e.target.value) })}
            />
            <Input
              type="number"
              className="bg-ambulance-card border-ambulance-border interactive-input"
              value={vitals.bloodPressureDia}
              onChange={(e) => setVitals({ ...vitals, bloodPressureDia: parseInt(e.target.value) })}
            />
          </div>
        </div>
        <div>
          <Label>Temperature (°F)</Label>
          <Input
            type="number"
            step="0.1"
            className="bg-ambulance-card border-ambulance-border interactive-input"
            value={vitals.temperature}
            onChange={(e) => setVitals({ ...vitals, temperature: parseFloat(e.target.value) })}
          />
        </div>
        <div>
          <Label>GCS Score</Label>
          <Input
            type="number"
            min="3"
            max="15"
            className="bg-ambulance-card border-ambulance-border interactive-input"
            value={vitals.gcs}
            onChange={(e) => setVitals({ ...vitals, gcs: parseInt(e.target.value) })}
          />
        </div>
      </div>

      <Button
        onClick={handleSendAlert}
        disabled={!selectedHospitalId}
        className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 glow-critical group relative overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
        <Send className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
        <span className="relative">Send Pre-Alert</span>
      </Button>
    </div>
  );
};
