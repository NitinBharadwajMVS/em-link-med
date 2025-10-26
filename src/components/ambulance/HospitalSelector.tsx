import { useState } from 'react';
import { Hospital } from '@/types/patient';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Building2, Phone, Navigation, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { calculateETA, hasRequiredEquipment, sortHospitalsByPreference } from '@/utils/distanceCalculator';

interface HospitalSelectorProps {
  hospitals: Hospital[];
  selectedHospitalId?: string;
  onSelect: (hospital: Hospital) => void;
  requiredEquipment?: string[];
  alertId?: string;
  readOnly?: boolean;
}

export const HospitalSelector = ({
  hospitals,
  selectedHospitalId,
  onSelect,
  requiredEquipment,
  alertId,
  readOnly = false,
}: HospitalSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedForConfirm, setSelectedForConfirm] = useState<Hospital | null>(null);

  const sortedHospitals = sortHospitalsByPreference(hospitals, alertId);
  const selectedHospital = hospitals.find((h) => h.id === selectedHospitalId);

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
        className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
          isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
        } ${isUnavailable ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => !isUnavailable && handleSelect(hospital)}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">{hospital.name}</h3>
              <p className="text-sm text-muted-foreground">{hospital.address}</p>
            </div>
          </div>
          {isSelected && (
            <CheckCircle className="w-6 h-6 text-primary" />
          )}
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
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full border-ambulance-border hover:bg-ambulance-card">
              {selectedHospital ? 'Change Hospital' : 'Select Hospital'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Select Hospital</DialogTitle>
              <DialogDescription>
                Choose the best hospital based on distance, equipment, and availability.
                {requiredEquipment && requiredEquipment.length > 0 && (
                  <div className="mt-2 p-2 bg-primary/5 rounded-lg">
                    <span className="font-semibold">Required Equipment: </span>
                    {requiredEquipment.join(', ')}
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 mt-4">
              {sortedHospitals.map(renderHospitalCard)}
            </div>

            {selectedForConfirm && (
              <div className="flex gap-3 mt-4 sticky bottom-0 bg-background p-4 border-t">
                <Button variant="outline" onClick={() => setSelectedForConfirm(null)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleConfirm} className="flex-1 bg-primary">
                  Confirm: {selectedForConfirm.name}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
