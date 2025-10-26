import { useState, useMemo } from 'react';
import { Hospital } from '@/types/patient';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Building2, Phone, Navigation, CheckCircle, AlertCircle, Clock, Search, Plus, Upload } from 'lucide-react';
import { calculateETA, hasRequiredEquipment, sortHospitalsByPreference } from '@/utils/distanceCalculator';
import { AddHospitalDialog } from './AddHospitalDialog';
import { ImportHospitalsDialog } from './ImportHospitalsDialog';

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
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full border-ambulance-border">
                {selectedHospital ? 'Change Hospital' : 'Select Hospital'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0">
              <DialogHeader className="px-6 pt-6 pb-4">
                <DialogTitle>Select Hospital</DialogTitle>
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

              <div className="px-6 pb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, locality, equipment, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-2 max-h-96">
                {filteredHospitals.length > 0 ? (
                  <div className="space-y-3">
                    {filteredHospitals.map(renderHospitalCard)}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <AlertCircle className="w-12 h-12 mb-2" />
                    <p>No hospitals found matching your search</p>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t bg-muted/20">
                <div className="flex gap-2 mb-3">
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
                <p className="text-xs text-muted-foreground text-center">
                  Tip: Type to search or click "Add New Hospital" to include your facility for this demo
                </p>
              </div>

              {selectedForConfirm && (
                <div className="flex gap-3 px-6 py-4 border-t bg-background">
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
