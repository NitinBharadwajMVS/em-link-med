import { useState, useMemo } from 'react';
import { Hospital } from '@/types/patient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Building2, Phone, Navigation, CheckCircle, AlertCircle, Clock, Search, Plus, Upload, MapPin, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { calculateDistance, calculateETA, hasRequiredEquipment, sortHospitalsByPreference, getFallbackRecommendation } from '@/utils/distanceCalculator';
import { AddHospitalDialog } from './AddHospitalDialog';
import { ImportHospitalsDialog } from './ImportHospitalsDialog';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface HospitalSelectorProps {
  hospitals: Hospital[];
  selectedHospitalId?: string;
  onSelect: (hospital: Hospital) => void;
  requiredEquipment?: string[];
  alertId?: string;
  readOnly?: boolean;
  onAddHospital?: (hospital: Hospital) => void;
  onImportHospitals?: (hospitals: Hospital[]) => void;
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
  requiredEquipment,
  alertId,
  readOnly = false,
  onAddHospital,
  onImportHospitals,
}: HospitalSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedForConfirm, setSelectedForConfirm] = useState<Hospital | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [isAiMode, setIsAiMode] = useState(false);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [geolocationStatus, setGeolocationStatus] = useState<GeolocationStatus>('idle');
  const [ambulanceLocation, setAmbulanceLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  // Recalculate hospital distances based on ambulance location
  const hospitalsWithDistances = useMemo(() => {
    if (!ambulanceLocation) return hospitals;
    
    return hospitals.map(hospital => ({
      ...hospital,
      distance: calculateDistance(
        ambulanceLocation.latitude,
        ambulanceLocation.longitude,
        hospital.latitude,
        hospital.longitude
      )
    }));
  }, [hospitals, ambulanceLocation]);

  const sortedHospitals = sortHospitalsByPreference(hospitalsWithDistances, alertId);
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
    setSelectedForConfirm(hospital);
  };

  const handleConfirm = () => {
    if (selectedForConfirm) {
      onSelect(selectedForConfirm);
      setIsOpen(false);
      setSelectedForConfirm(null);
      setAiRecommendations([]);
      setIsAiMode(false);
    }
  };

  const handleAiRecommend = async () => {
    if (!ambulanceLocation) {
      requestGeolocation();
      return;
    }

    setIsLoadingAi(true);
    try {
      const { data, error } = await supabase.functions.invoke('recommend-hospital', {
        body: {
          patientData: {
            vitals: {
              spo2: 95,
              heartRate: 80,
              bloodPressureSys: 120,
              bloodPressureDia: 80,
              temperature: 37,
              gcs: 15,
            },
            triageLevel: 'urgent',
            complaint: 'Emergency transfer',
            requiredEquipment,
          },
          hospitalList: sortedHospitals,
          ambulanceLocation,
        },
      });

      if (error) throw error;

      if (data?.useFallback) {
        // Use fallback logic
        const fallbackHospitals = getFallbackRecommendation(sortedHospitals, ambulanceLocation, requiredEquipment);
        setAiRecommendations(
          fallbackHospitals.map(h => ({
            hospitalName: h.name,
            confidence: (h as any).score,
            reasoning: `Equipment match score and proximity-based recommendation. Distance: ${h.distance.toFixed(1)}km`,
          }))
        );
        setIsAiMode(false);
      } else if (data?.recommendations) {
        setAiRecommendations(data.recommendations);
        setIsAiMode(true);
      }
    } catch (error) {
      console.error('AI recommendation error:', error);
      // Fallback to deterministic method
      const fallbackHospitals = getFallbackRecommendation(sortedHospitals, ambulanceLocation, requiredEquipment);
      setAiRecommendations(
        fallbackHospitals.map(h => ({
          hospitalName: h.name,
          confidence: (h as any).score,
          reasoning: `Equipment match score and proximity-based recommendation. Distance: ${h.distance.toFixed(1)}km`,
        }))
      );
      setIsAiMode(false);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const renderHospitalCard = (hospital: Hospital) => {
    const eta = calculateETA(hospital.distance);
    const equipmentCheck = hasRequiredEquipment(hospital, requiredEquipment);
    const isSelected = hospital.id === (selectedForConfirm?.id || selectedHospitalId);
    const isUnavailable = hospital.unavailableForAlert === alertId;

    return (
      <Card
        key={hospital.id}
        className={`p-4 cursor-pointer transition-all border shadow-sm
          ${isSelected ? 'ring-2 ring-primary bg-primary/5 border-primary' : 'border-border'}
          ${isUnavailable ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50'}
          focus-within:ring-2 focus-within:ring-primary/30`}
        onClick={() => !isUnavailable && handleSelect(hospital)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            !isUnavailable && handleSelect(hospital);
          }
        }}
      >
        <div className="flex items-start gap-4 mb-3">
          <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-7 h-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-lg leading-tight">{hospital.name}</h3>
              {isSelected && (
                <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{hospital.address}</p>
          </div>
        </div>

        <div className="flex gap-2 mb-3 flex-wrap">
          <Badge variant="outline" className="flex items-center gap-1">
            <Navigation className="w-3 h-3" />
            {hospital.distance.toFixed(1)} km
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            ETA: {eta} min
          </Badge>
          {isUnavailable && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Unavailable
            </Badge>
          )}
        </div>

        {hospital.contact && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Phone className="w-4 h-4" />
            <a href={`tel:${hospital.contact}`} className="hover:text-primary">
              {hospital.contact}
            </a>
          </div>
        )}

        {hospital.equipment && hospital.equipment.length > 0 && (
          <div className="mb-2">
            <div className="text-xs font-semibold text-muted-foreground mb-1">Equipment:</div>
            <div className="flex flex-wrap gap-1">
              {hospital.equipment.map((eq) => (
                <Badge
                  key={eq}
                  variant="secondary"
                  className={`text-xs ${
                    requiredEquipment?.includes(eq) ? 'bg-stable/20 text-stable' : ''
                  }`}
                >
                  {eq}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {!equipmentCheck.hasAll && (
          <div className="mt-2 p-2 bg-critical/10 rounded-lg border border-critical/20">
            <div className="flex items-center gap-2 text-critical text-xs font-semibold">
              <AlertCircle className="w-4 h-4" />
              Missing: {equipmentCheck.missing.join(', ')}
            </div>
          </div>
        )}

        {hospital.specialties && hospital.specialties.length > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">
            Specialties: {hospital.specialties.join(', ')}
          </div>
        )}

        {!isUnavailable && (
          <Button
            size="sm"
            variant={isSelected ? "default" : "outline"}
            className="w-full mt-3"
            onClick={(e) => {
              e.stopPropagation();
              handleSelect(hospital);
            }}
          >
            {isSelected ? 'Selected' : 'Select Hospital'}
          </Button>
        )}
      </Card>
    );
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
      
      <ImportHospitalsDialog 
        open={showImportDialog} 
        onOpenChange={setShowImportDialog}
        onImport={(importedHospitals) => {
          onImportHospitals?.(importedHospitals);
          setShowImportDialog(false);
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
                          {selectedHospital.distance.toFixed(1)} km • ETA: {calculateETA(selectedHospital.distance)} min
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Select a hospital</span>
                    )}
                  </div>
                </div>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
              <DialogHeader className="p-6 pb-4 border-b bg-gradient-to-b from-background to-muted/20">
                <DialogTitle className="text-2xl">
                  Select Hospital {selectedHospital && `(Current: ${selectedHospital.name})`}
                </DialogTitle>
                <DialogDescription>
                  {requiredEquipment && requiredEquipment.length > 0 && (
                    <div className="mt-3 p-3 bg-stable/10 rounded-lg border border-stable/20">
                      <div className="text-sm font-semibold text-stable flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4" />
                        Required Equipment:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {requiredEquipment.map((eq) => (
                          <Badge key={eq} variant="outline" className="border-stable/30 text-stable">
                            {eq}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="px-6 py-4 space-y-4 border-b">
                {/* Geolocation status */}
                {ambulanceLocation && (
                  <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <MapPin className="w-4 h-4 text-primary" />
                    <div className="flex-1 text-sm">
                      <span className="font-semibold">Ambulance Location: </span>
                      <span className="text-muted-foreground">
                        {ambulanceLocation.latitude.toFixed(4)}, {ambulanceLocation.longitude.toFixed(4)}
                        {usingFallback && <span className="ml-2 text-amber-500">(Fallback - {FALLBACK_LOCATION.name})</span>}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={requestGeolocation}
                      disabled={geolocationStatus === 'requesting'}
                    >
                      <RefreshCw className={cn("w-4 h-4", geolocationStatus === 'requesting' && "animate-spin")} />
                      Retry
                    </Button>
                  </div>
                )}

                {/* Geolocation permission flow */}
                {!ambulanceLocation && geolocationStatus !== 'idle' && (
                  <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                    {geolocationStatus === 'requesting' && (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                        <span className="text-sm">Requesting location permission...</span>
                      </>
                    )}
                    {geolocationStatus === 'denied' && (
                      <>
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        <span className="text-sm">Location permission denied. Using fallback coordinates.</span>
                      </>
                    )}
                    {geolocationStatus === 'error' && (
                      <>
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        <span className="text-sm">Geolocation not supported. Using fallback coordinates.</span>
                      </>
                    )}
                  </div>
                )}

                {/* AI Recommend & Mode Badge */}
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleAiRecommend}
                    disabled={isLoadingAi}
                    variant="default"
                    className="flex-shrink-0"
                  >
                    {isLoadingAi ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    {ambulanceLocation ? 'AI Recommend' : 'Get Location & AI Recommend'}
                  </Button>
                  
                  {aiRecommendations.length > 0 && (
                    <Badge variant={isAiMode ? "default" : "secondary"} className="flex items-center gap-1.5">
                      {isAiMode ? (
                        <>
                          🤖 Mode: Live (GROQ)
                        </>
                      ) : (
                        <>
                          ⚡ Mode: Offline (fallback)
                        </>
                      )}
                    </Badge>
                  )}
                </div>

                {/* AI Recommendations */}
                {aiRecommendations.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">AI Recommendations:</h3>
                    {aiRecommendations.map((rec, idx) => {
                      const hospital = sortedHospitals.find(h => h.name === rec.hospitalName);
                      return hospital ? (
                        <div key={idx} className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold">#{idx + 1} {rec.hospitalName}</span>
                            <Badge variant="outline">{rec.confidence}% confidence</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{rec.reasoning}</p>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}

                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search hospitals by name, address, or equipment..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Management buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Hospital
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowImportDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Import Hospitals
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1 px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                  {filteredHospitals.map((hospital) => renderHospitalCard(hospital))}
                  {filteredHospitals.length === 0 && (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      No hospitals found matching your search.
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="p-6 pt-4 border-t flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleConfirm} disabled={!selectedForConfirm}>
                  Confirm Selection
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
                      {selectedHospital.distance.toFixed(1)} km
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {calculateETA(selectedHospital.distance)} min
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
