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
import { Building2, Phone, Navigation, CheckCircle, AlertCircle, Clock, Search, Plus, Upload, MapPin, Loader2, Sparkles } from 'lucide-react';
import { calculateETA, hasRequiredEquipment, sortHospitalsByPreference, getFallbackRecommendation } from '@/utils/distanceCalculator';
import { AddHospitalDialog } from './AddHospitalDialog';
import { ImportHospitalsDialog } from './ImportHospitalsDialog';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

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

  const sortedHospitals = sortHospitalsByPreference(hospitals, alertId);
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
        },
      });

      if (error) throw error;

      if (data?.useFallback) {
        // Use fallback logic
        const fallbackHospitals = getFallbackRecommendation(sortedHospitals, requiredEquipment);
        setAiRecommendations(
          fallbackHospitals.map(h => ({
            hospitalName: h.name,
            confidence: (h as any).score,
            reasoning: `Equipment match score and proximity-based recommendation. Distance: ${h.distance}km`,
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
      const fallbackHospitals = getFallbackRecommendation(sortedHospitals, requiredEquipment);
      setAiRecommendations(
        fallbackHospitals.map(h => ({
          hospitalName: h.name,
          confidence: (h as any).score,
          reasoning: `Equipment match score and proximity-based recommendation. Distance: ${h.distance}km`,
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
            {hospital.distance} km
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
    <div className="space-y-3">
      {selectedHospital && (
        <div>
          <Label>Selected Hospital</Label>
          <Card className="p-4 bg-ambulance-card border-ambulance-border">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-lg">{selectedHospital.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{selectedHospital.address}</p>
                {selectedHospital.contact && (
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4" />
                    <a
                      href={`tel:${selectedHospital.contact}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {selectedHospital.contact}
                    </a>
                  </div>
                )}
                <div className="flex gap-2">
                  <Badge variant="outline">
                    <Navigation className="w-3 h-3 mr-1" />
                    {selectedHospital.distance} km
                  </Badge>
                  <Badge variant="outline">
                    <Clock className="w-3 h-3 mr-1" />
                    ETA: {calculateETA(selectedHospital.distance)} min
                  </Badge>
                </div>
                {selectedHospital.equipment && selectedHospital.equipment.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs font-semibold text-muted-foreground mb-1">Equipment:</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedHospital.equipment.map((eq) => (
                        <Badge key={eq} variant="secondary" className="text-xs">
                          {eq}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {!readOnly && (
        <>
          <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) {
              setSearchQuery('');
              setSelectedForConfirm(null);
              setAiRecommendations([]);
              setIsAiMode(false);
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full border-ambulance-border">
                {selectedHospital ? 'Change Hospital' : 'Select Hospital'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-hospital-dark border-hospital-border">
              <DialogHeader>
                <DialogTitle className="text-2xl text-hospital-text flex items-center gap-3">
                  Select Hospital
                  {aiRecommendations.length > 0 && (
                    <span className="text-sm font-normal px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/30">
                      {isAiMode ? '🤖 AI Recommendation Active' : '⚡ Offline Recommendation Mode'}
                    </span>
                  )}
                </DialogTitle>
                <DialogDescription>
                  Choose the best hospital based on distance, equipment, and availability.
                  {requiredEquipment && requiredEquipment.length > 0 && (
                    <div className="mt-2 p-2 bg-primary/5 rounded-lg text-sm">
                      <span className="font-semibold">Required Equipment: </span>
                      {requiredEquipment.join(', ')}
                    </div>
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search hospitals by name, address, equipment..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-hospital-card border-hospital-border text-hospital-text"
                  />
                  <Button
                    onClick={handleAiRecommend}
                    disabled={isLoadingAi}
                    className="bg-primary text-primary-foreground hover:shadow-[inset_0_0_20px_rgba(96,165,250,0.4)] transition-all duration-300"
                  >
                    {isLoadingAi ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        AI Recommend
                      </>
                    )}
                  </Button>
                </div>

                {aiRecommendations.length > 0 ? (
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {aiRecommendations.map((rec, idx) => {
                        const hospital = sortedHospitals.find(h => h.name === rec.hospitalName);
                        if (!hospital) return null;
                        
                        return (
                          <Card
                            key={hospital.id}
                            onClick={() => handleSelect(hospital)}
                            className={cn(
                              "cursor-pointer transition-all duration-300 border-2 bg-hospital-card",
                              selectedForConfirm?.id === hospital.id
                                ? "border-primary shadow-[0_0_20px_rgba(96,165,250,0.3)]"
                                : "border-hospital-border hover:border-primary/50"
                            )}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold border border-primary/30">
                                    {idx + 1}
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-lg text-hospital-text flex items-center gap-2">
                                      {hospital.name}
                                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                                        {rec.confidence}% match
                                      </Badge>
                                    </h3>
                                    <p className="text-sm text-hospital-muted">{hospital.address}</p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                                <div className="flex items-center text-hospital-muted">
                                  <MapPin className="h-4 w-4 mr-1 text-primary" />
                                  <span>{hospital.distance} km</span>
                                </div>
                                <div className="flex items-center text-hospital-muted">
                                  <Clock className="h-4 w-4 mr-1 text-primary" />
                                  <span>ETA: {calculateETA(hospital.distance)} min</span>
                                </div>
                              </div>

                              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                                <p className="text-sm text-hospital-text">
                                  <span className="font-semibold text-primary">AI Analysis:</span> {rec.reasoning}
                                </p>
                              </div>

                              {hospital.equipment && hospital.equipment.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-xs text-hospital-muted mb-1">Available Equipment:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {hospital.equipment.slice(0, 4).map((eq) => (
                                      <Badge key={eq} variant="secondary" className="text-xs bg-hospital-dark">
                                        {eq}
                                      </Badge>
                                    ))}
                                    {hospital.equipment.length > 4 && (
                                      <Badge variant="secondary" className="text-xs bg-hospital-dark">
                                        +{hospital.equipment.length - 4} more
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </ScrollArea>
                ) : (
                  <ScrollArea className="h-[400px] pr-4">
                    {filteredHospitals.length === 0 ? (
                      <div className="text-center py-8 text-hospital-muted">
                        No hospitals found matching your search.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredHospitals.map((hospital) => renderHospitalCard(hospital))}
                      </div>
                    )}
                  </ScrollArea>
                )}

                <div className="flex gap-2">
                  {onAddHospital && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddDialog(true)}
                      className="flex-1"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Hospital
                    </Button>
                  )}
                  {onImportHospitals && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowImportDialog(true)}
                      className="flex-1"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Import CSV/JSON
                    </Button>
                  )}
                </div>
              </div>

              {selectedForConfirm && (
                <div className="flex gap-3 mt-4">
                  <Button variant="outline" onClick={() => setSelectedForConfirm(null)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleConfirm} className="flex-1">
                    Confirm: {selectedForConfirm.name}
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <AddHospitalDialog
            open={showAddDialog}
            onOpenChange={setShowAddDialog}
            onAdd={(hospital) => onAddHospital?.(hospital)}
          />

          <ImportHospitalsDialog
            open={showImportDialog}
            onOpenChange={setShowImportDialog}
            onImport={(hospitals) => onImportHospitals?.(hospitals)}
          />
        </>
      )}
    </div>
  );
};
