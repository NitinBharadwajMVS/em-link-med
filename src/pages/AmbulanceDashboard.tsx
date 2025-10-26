import { useState, useEffect, useCallback } from 'react';
import { TriageButton } from '@/components/ambulance/TriageButton';
import { PatientForm } from '@/components/ambulance/PatientForm';
import { TriageLevel } from '@/types/patient';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { LogOut, Ambulance, Phone, Navigation } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { AmbulanceMap } from '@/components/maps/AmbulanceMap';
import { HospitalWithRoute, calculateRoutesToHospitals, Coordinates } from '@/services/geoapifyRouting';
import { GEOAPIFY_CONFIG } from '@/config/geoapify';
import { throttle } from '@/utils/debounce';
import { useToast } from '@/hooks/use-toast';

const AmbulanceDashboard = () => {
  const [selectedTriage, setSelectedTriage] = useState<TriageLevel | null>(null);
  const [ambulancePosition, setAmbulancePosition] = useState<Coordinates>({ lat: 40.7489, lng: -73.9680 });
  const [hospitalsWithRoutes, setHospitalsWithRoutes] = useState<HospitalWithRoute[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<HospitalWithRoute | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const { logout, hospitals, sendAlert, updateHospitalStatus } = useApp();
  const navigate = useNavigate();
  const { toast } = useToast();

  const calculateRoutes = useCallback(async () => {
    if (isCalculating) return;
    
    setIsCalculating(true);
    try {
      const availableHospitals = hospitals
        .filter(h => h.status === 'available')
        .map(h => ({
          id: h.id,
          name: h.name,
          coordinates: h.coordinates,
          contact: h.contact,
          equipment: h.equipment,
        }));

      const results = await calculateRoutesToHospitals(ambulancePosition, availableHospitals);
      
      // Filter by radius
      const nearby = results.filter(h => h.distance <= GEOAPIFY_CONFIG.defaultRadius);
      setHospitalsWithRoutes(nearby);

      if (nearby.length === 0) {
        toast({
          title: "No hospitals nearby",
          description: "No available hospitals within 2km radius",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Route calculation failed:', error);
      toast({
        title: "Routing error",
        description: "Failed to calculate routes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  }, [ambulancePosition, hospitals, isCalculating, toast]);

  // Throttled route calculation
  const throttledCalculateRoutes = useCallback(
    throttle(calculateRoutes, GEOAPIFY_CONFIG.minUpdateInterval),
    [calculateRoutes]
  );

  useEffect(() => {
    calculateRoutes();
  }, []);

  useEffect(() => {
    throttledCalculateRoutes();
  }, [ambulancePosition, hospitals, throttledCalculateRoutes]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSendPreAlert = () => {
    if (!selectedHospital || !selectedTriage) {
      toast({
        title: "Missing information",
        description: "Please select a hospital and triage level",
        variant: "destructive",
      });
      return;
    }

    // This would normally get the actual patient data from the form
    const mockPatient = {
      id: `P${Date.now()}`,
      name: 'Patient Name',
      age: 45,
      gender: 'male' as const,
      contact: '+1-555-0000',
      vitals: {
        spo2: 95,
        heartRate: 85,
        bloodPressureSys: 130,
        bloodPressureDia: 85,
        temperature: 98.6,
        gcs: 15,
      },
      complaint: 'Emergency',
      triageLevel: selectedTriage,
      timestamp: new Date().toISOString(),
    };

    sendAlert({
      patient: mockPatient,
      ambulanceId: 'AMB-001',
      ambulanceContact: '+1-555-AMBULANCE',
      ambulanceEquipment: ['Defibrillator', 'Oxygen', 'Medications', 'Stretcher'],
      ambulancePosition,
      hospitalId: selectedHospital.id,
      eta: selectedHospital.eta,
      distance: selectedHospital.distance,
      route: selectedHospital.route?.coordinates,
    });

    toast({
      title: "Pre-alert sent",
      description: `Alert sent to ${selectedHospital.name}`,
    });
  };

  const handleHospitalDeclined = useCallback((hospitalId: string) => {
    updateHospitalStatus(hospitalId, 'unavailable');
    setSelectedHospital(null);
    toast({
      title: "Hospital unavailable",
      description: "Recalculating routes to next best hospital...",
    });
  }, [updateHospitalStatus, toast]);

  return (
    <div
      className="min-h-screen p-4 md:p-6"
      style={{
        background: 'linear-gradient(135deg, hsl(220, 40%, 8%) 0%, hsl(220, 45%, 15%) 100%)',
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Ambulance className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Emergency Response</h1>
              <p className="text-sm text-muted-foreground">AMB-001</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Map */}
          <Card className="p-0 overflow-hidden h-[500px]">
            <AmbulanceMap
              ambulancePosition={ambulancePosition}
              hospitals={hospitalsWithRoutes}
              selectedHospital={selectedHospital}
              onHospitalSelect={setSelectedHospital}
            />
          </Card>

          {/* Hospital List */}
          <Card className="p-6 bg-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Nearby Hospitals</h2>
              <Button
                size="sm"
                variant="outline"
                onClick={calculateRoutes}
                disabled={isCalculating}
              >
                <Navigation className="w-4 h-4 mr-2" />
                {isCalculating ? 'Calculating...' : 'Refresh Routes'}
              </Button>
            </div>
            
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {hospitalsWithRoutes.map((hospital, index) => (
                <Card
                  key={hospital.id}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedHospital?.id === hospital.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedHospital(hospital)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-primary">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1">{hospital.name}</h3>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Navigation className="w-3 h-3" />
                          <span>ETA: {hospital.eta} min • {(hospital.distance / 1000).toFixed(1)} km</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          <a href={`tel:${hospital.contact}`} className="hover:text-primary">
                            {hospital.contact}
                          </a>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {hospital.equipment.join(', ')}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </div>

        {/* Triage Selection */}
        <div className="flex gap-4 mb-6">
          <TriageButton
            level="critical"
            onClick={() => setSelectedTriage('critical')}
            isActive={selectedTriage === 'critical'}
          />
          <TriageButton
            level="urgent"
            onClick={() => setSelectedTriage('urgent')}
            isActive={selectedTriage === 'urgent'}
          />
          <TriageButton
            level="stable"
            onClick={() => setSelectedTriage('stable')}
            isActive={selectedTriage === 'stable'}
          />
        </div>

        {/* Send Pre-Alert */}
        {selectedHospital && selectedTriage && (
          <Card className="p-6 bg-card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">Send Pre-Alert to {selectedHospital.name}</h3>
                <p className="text-sm text-muted-foreground">
                  ETA: {selectedHospital.eta} min • Distance: {(selectedHospital.distance / 1000).toFixed(1)} km
                </p>
              </div>
              <Button onClick={handleSendPreAlert} size="lg">
                Send Pre-Alert
              </Button>
            </div>
          </Card>
        )}

        {/* Patient Form */}
        {selectedTriage && (
          <Card className="p-6 bg-card mt-6">
            <PatientForm triageLevel={selectedTriage} onClose={() => setSelectedTriage(null)} />
          </Card>
        )}
      </div>
    </div>
  );
};

export default AmbulanceDashboard;
