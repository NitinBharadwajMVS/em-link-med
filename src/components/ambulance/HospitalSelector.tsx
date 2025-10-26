import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Hospital } from '@/types/patient';
import { calculateRoute, formatDistance, formatDuration, RouteResult } from '@/utils/routeService';
import { Phone, Navigation, MapPin, XCircle, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface HospitalSelectorProps {
  hospitals: Hospital[];
  ambulanceLocation: { lat: number; lng: number };
  onSelectHospital: (hospital: Hospital) => void;
  selectedHospitalId?: string;
}

interface HospitalWithRoute extends Hospital {
  route?: RouteResult;
  isCalculating?: boolean;
}

export const HospitalSelector = ({ 
  hospitals, 
  ambulanceLocation, 
  onSelectHospital,
  selectedHospitalId 
}: HospitalSelectorProps) => {
  const [hospitalsWithRoutes, setHospitalsWithRoutes] = useState<HospitalWithRoute[]>([]);

  useEffect(() => {
    const calculateRoutes = async () => {
      const updatedHospitals = await Promise.all(
        hospitals.map(async (hospital) => {
          try {
            const route = await calculateRoute(ambulanceLocation, hospital.coordinates);
            return { ...hospital, route };
          } catch (error) {
            console.error(`Failed to calculate route for ${hospital.name}:`, error);
            return { ...hospital };
          }
        })
      );

      // Sort by duration (ETA)
      const sorted = updatedHospitals.sort((a, b) => {
        const durationA = (a as HospitalWithRoute).route?.duration || Infinity;
        const durationB = (b as HospitalWithRoute).route?.duration || Infinity;
        return durationA - durationB;
      });

      setHospitalsWithRoutes(sorted);
    };

    calculateRoutes();
  }, [hospitals, ambulanceLocation]);

  const handleCall = (phone: string, hospitalName: string) => {
    toast.success(`Calling ${hospitalName}...`, {
      description: phone,
    });
    // In real app: window.location.href = `tel:${phone}`;
  };

  const handleNavigate = (hospital: HospitalWithRoute) => {
    onSelectHospital(hospital);
    toast.success(`Route set to ${hospital.name}`, {
      description: `ETA: ${hospital.route ? formatDuration(hospital.route.duration) : 'Calculating...'}`,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-ambulance-text">Nearest Hospitals</h3>
        <Badge variant="outline" className="border-ambulance-border">
          {hospitalsWithRoutes.length} available
        </Badge>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
        {hospitalsWithRoutes.map((hospital, index) => (
          <Card
            key={hospital.id}
            className={`p-4 bg-ambulance-card border-ambulance-border text-ambulance-text 
              transition-all duration-300 hover:scale-[1.02] hover:shadow-xl
              ${selectedHospitalId === hospital.id ? 'ring-2 ring-primary shadow-lg' : ''}
              ${!hospital.canAccept ? 'opacity-60' : ''}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    #{index + 1}
                  </Badge>
                  <h4 className="font-semibold text-lg">{hospital.name}</h4>
                  {!hospital.canAccept && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      Cannot Accept
                    </Badge>
                  )}
                  {hospital.canAccept && selectedHospitalId === hospital.id && (
                    <Badge className="bg-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Selected
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {hospital.route ? formatDistance(hospital.route.distance) : 'Calculating...'}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {hospital.route ? formatDuration(hospital.route.duration) : 'Calculating...'}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">{hospital.address}</p>

                <div className="flex flex-wrap gap-1">
                  {hospital.capabilities.map((cap) => (
                    <Badge
                      key={cap}
                      variant="outline"
                      className="text-xs border-primary/30 text-primary"
                    >
                      {cap}
                    </Badge>
                  ))}
                </div>

                {hospital.availableBeds !== undefined && (
                  <p className="text-xs text-muted-foreground">
                    Available beds: {hospital.availableBeds}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCall(hospital.phone, hospital.name)}
                  className="border-ambulance-border hover:bg-ambulance-card"
                >
                  <Phone className="w-4 h-4 mr-1" />
                  Call
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleNavigate(hospital)}
                  disabled={!hospital.canAccept}
                  className={selectedHospitalId === hospital.id ? 'bg-green-600' : ''}
                >
                  <Navigation className="w-4 h-4 mr-1" />
                  Navigate
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
