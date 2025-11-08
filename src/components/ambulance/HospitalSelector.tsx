import { useState, useMemo } from 'react';
import { Hospital } from '@/types/patient';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Building2, Navigation, Clock, Search, Plus, MapPin, Loader2, RefreshCw } from 'lucide-react';
import { calculateDistance, calculateETA, sortHospitalsByDistance } from '@/utils/distanceCalculator';
import { AddHospitalDialog } from './AddHospitalDialog';
import { HospitalRow } from './HospitalRow';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface HospitalSelectorProps {
  hospitals: Hospital[];
  selectedHospitalId?: string;
  onSelect: (hospital: Hospital) => void;
  alertId?: string;
  readOnly?: boolean;
  onAddHospital?: (hospital: Hospital) => void;
}

type GeolocationStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'error';

const FALLBACK_LOCATION = {
  latitude: 12.9279,
  longitude: 77.6271,
  name: 'Bannerghatta Road, Bangalore (Fallback)'
};

export const HospitalSelector = ({
  hospitals,
  selectedHospitalId,
  onSelect,
  alertId,
  readOnly = false,
  onAddHospital,
}: HospitalSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedForConfirm, setSelectedForConfirm] = useState<Hospital | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [geolocationStatus, setGeolocationStatus] = useState<GeolocationStatus>('idle');
  const [ambulanceLocation, setAmbulanceLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [etaMethod, setEtaMethod] = useState<'routing' | 'fallback'>('fallback');

  // Recalculate hospital distances and ETAs based on ambulance location
  const hospitalsWithDistances = useMemo(() => {
    if (!ambulanceLocation) return hospitals;
    
    return hospitals.map(hospital => {
      const distance = calculateDistance(
        ambulanceLocation.latitude,
        ambulanceLocation.longitude,
        hospital.latitude,
        hospital.longitude
      );
      const eta = calculateETA(distance);
      return {
        ...hospital,
        distance: isNaN(distance) ? 0 : distance,
        eta: isNaN(eta) ? 0 : eta
      };
    });
  }, [hospitals, ambulanceLocation]);

  const sortedHospitals = sortHospitalsByDistance(hospitalsWithDistances, alertId);
  const selectedHospital = hospitals.find((h) => h.id === selectedHospitalId);

  // Filter hospitals based on search query
  const filteredHospitals = useMemo(() => {
    if (!searchQuery.trim()) return sortedHospitals;
    
    const query = searchQuery.toLowerCase();
    return sortedHospitals.filter((hospital) => {
      return (
        hospital.name.toLowerCase().includes(query) ||
        hospital.address.toLowerCase().includes(query) ||
        hospital.contact?.toLowerCase().includes(query) ||
        hospital.equipment?.some((eq) => eq.toLowerCase().includes(query))
      );
    });
  }, [sortedHospitals, searchQuery]);

  const requestGeolocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported by browser');
      setGeolocationStatus('error');
      setAmbulanceLocation(FALLBACK_LOCATION);
      setUsingFallback(true);
      return;
    }

    setGeolocationStatus('requesting');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        setAmbulanceLocation(location);
        setGeolocationStatus('granted');
        setUsingFallback(false);
        toast.success(`Location obtained: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setGeolocationStatus('denied');
        setAmbulanceLocation(FALLBACK_LOCATION);
        setUsingFallback(true);
        toast.warning(`Location permission denied. Using fallback: ${FALLBACK_LOCATION.name}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleSelect = (hospital: Hospital) => {
    onSelect(hospital);
    setIsOpen(false);
    setSelectedForConfirm(null);
    toast.success(`✅ Selected: ${hospital.name}`);
  };

  return (
    <>
      <AddHospitalDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog}
        onAdd={(hospital) => {
          onAddHospital?.(hospital);
          setShowAddDialog(false);
        }}
      />
      
      <div className="space-y-2">
        <Label className="text-base font-semibold">Hospital Selection</Label>
        <div className="flex gap-2">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-start h-auto py-3"
                disabled={readOnly}
              >
                <div className="flex items-center w-full">
                  <Building2 className="w-5 h-5 mr-2 flex-shrink-0" />
                  <div className="flex-1 text-left">
                    {selectedHospital ? (
                      <div>
                        <div className="font-semibold">{selectedHospital.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {selectedHospital.distance?.toFixed(1) || '—'} km • ETA: {selectedHospital.eta || calculateETA(selectedHospital.distance || 0)} min
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Select a hospital</span>
                    )}
                  </div>
                </div>
              </Button>
            </DialogTrigger>
            <DialogContent className="hospital-panel max-w-4xl h-[90vh] flex flex-col p-0 z-[100]">
              <DialogHeader className="p-6 pb-4 border-b bg-gradient-to-b from-background to-muted/20">
                <DialogTitle className="text-xl">
                  Select Hospital
                </DialogTitle>
                <DialogDescription>
                  Showing hospitals sorted by distance from ambulance location
                </DialogDescription>
              </DialogHeader>

              <div className="px-6 py-4 space-y-3 border-b">
                {/* Dev log */}
                {ambulanceLocation && (
                  <div className="p-3 bg-muted/50 rounded-lg border text-xs font-mono space-y-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Location: {ambulanceLocation.latitude.toFixed(4)}, {ambulanceLocation.longitude.toFixed(4)}
                        {usingFallback && <span className="ml-2 text-amber-600">(Fallback)</span>}
                      </span>
                    </div>
                    <div className="text-muted-foreground">
                      ETA Method: {etaMethod === 'routing' ? '🌐 Routing API' : '📐 Haversine (40 km/h)'}
                    </div>
                  </div>
                )}

                {/* Geolocation permission flow */}
                {!ambulanceLocation && (
                  <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                    {geolocationStatus === 'idle' && (
                      <Button
                        onClick={requestGeolocation}
                        variant="default"
                        size="sm"
                        className="w-full"
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        Get Ambulance Location
                      </Button>
                    )}
                    {geolocationStatus === 'requesting' && (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <span className="text-sm">Requesting location permission...</span>
                      </>
                    )}
                    {geolocationStatus === 'denied' && (
                      <>
                        <MapPin className="w-4 h-4 text-amber-500" />
                        <div className="flex-1 text-sm">
                          Location denied. Using fallback.
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={requestGeolocation}
                        >
                          <RefreshCw className="w-4 h-4" />
                          Retry
                        </Button>
                      </>
                    )}
                    {geolocationStatus === 'error' && (
                      <>
                        <MapPin className="w-4 h-4 text-red-500" />
                        <span className="text-sm">Location error. Using fallback.</span>
                      </>
                    )}
                  </div>
                )}

                {/* Retry button when location is active */}
                {ambulanceLocation && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={requestGeolocation}
                    disabled={geolocationStatus === 'requesting'}
                    className="w-full"
                  >
                    <RefreshCw className={cn("w-4 h-4 mr-2", geolocationStatus === 'requesting' && "animate-spin")} />
                    Refresh Location
                  </Button>
                )}

                {/* Search Input - Full Width */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search hospitals by name or locality..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>

                {/* Add Hospital button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddDialog(true)}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Hospital
                </Button>
              </div>

              <ScrollArea className="flex-1 px-6 hospital-list-scroll">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                  {!ambulanceLocation && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Please enable location to view nearby hospitals</p>
                    </div>
                  )}
                  {ambulanceLocation && filteredHospitals.length === 0 && (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      No hospitals found matching your search.
                    </div>
                  )}
                  {ambulanceLocation && filteredHospitals.map((hospital) => (
                    <HospitalRow
                      key={hospital.id}
                      hospital={hospital}
                      isSelected={hospital.id === selectedHospitalId}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              </ScrollArea>

              <div className="p-6 pt-4 border-t flex justify-end">
                <Button variant="outline" onClick={() => setIsOpen(false)} className="min-h-[44px]">
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {selectedHospital && (
          <Card className="p-4 border-primary/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">{selectedHospital.name}</h4>
                  <div className="text-sm text-muted-foreground flex gap-3 mt-1">
                    <span className="flex items-center gap-1">
                      <Navigation className="w-3 h-3" />
                      {selectedHospital.distance?.toFixed(1) || '—'} km
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {selectedHospital.eta || calculateETA(selectedHospital.distance || 0)} min
                    </span>
                  </div>
                </div>
              </div>
              {!readOnly && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(true)}
                >
                  Change
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>
    </>
  );
};
