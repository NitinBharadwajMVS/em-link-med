import { useState } from 'react';
import { Alert } from '@/types/patient';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Activity, Clock, User, Phone, ChevronDown, ChevronUp, Check, X, Package } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';

interface AlertCardProps {
  alert: Alert;
}

export const AlertCard = ({ alert }: AlertCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { updateAlertStatus } = useApp();
  const { patient } = alert;

  const triageColors = {
    critical: 'bg-critical/20 border-critical text-critical',
    urgent: 'bg-urgent/20 border-urgent text-urgent',
    stable: 'bg-stable/20 border-stable text-stable',
  };

  const handleAcknowledge = () => {
    updateAlertStatus(alert.id, 'acknowledged');
    toast.success('Alert acknowledged');
  };

  const handleAccept = () => {
    updateAlertStatus(alert.id, 'accepted');
    toast.success('Patient case accepted', {
      description: `${patient.name} will arrive in ${alert.eta} minutes`,
    });
  };

  const handleReject = () => {
    updateAlertStatus(alert.id, 'rejected');
    toast.error('Case rejected - Ambulance will be notified', {
      description: 'They will select an alternative hospital',
    });
  };

  return (
    <Card
      className={cn(
        'p-6 transition-all duration-300 hover:shadow-lg',
        alert.status === 'pending' && 'animate-pulse-glow',
        triageColors[patient.triageLevel]
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm font-bold uppercase">
            {patient.triageLevel}
          </Badge>
          <Badge variant="secondary">{alert.ambulanceId}</Badge>
          {alert.status !== 'pending' && (
            <Badge className="bg-stable text-white">
              {alert.status === 'acknowledged' ? 'Acknowledged' : 'Accepted'}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="font-semibold">ETA: {alert.eta} min</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <div>
            <div className="font-semibold text-lg">{patient.name}</div>
            <div className="text-sm text-muted-foreground">{patient.age}y • {patient.gender}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">{patient.contact}</span>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-sm font-semibold text-muted-foreground mb-1">Chief Complaint</div>
        <div className="font-medium">{patient.complaint}</div>
      </div>

      {alert.requiredEquipment && alert.requiredEquipment.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2">
            <Package className="w-4 h-4" />
            Required Equipment
          </div>
          <div className="flex flex-wrap gap-2">
            {alert.requiredEquipment.map((equipment) => (
              <Badge key={equipment} variant="outline" className="text-xs">
                {equipment}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3 mb-4 text-center">
        <div className="p-2 bg-card rounded-lg">
          <div className="text-xs text-muted-foreground">SpO₂</div>
          <div className={cn("font-bold text-lg", patient.vitals.spo2 < 94 && "text-critical")}>
            {patient.vitals.spo2}%
          </div>
        </div>
        <div className="p-2 bg-card rounded-lg">
          <div className="text-xs text-muted-foreground">HR</div>
          <div className={cn("font-bold text-lg", patient.vitals.heartRate > 100 && "text-urgent")}>
            {patient.vitals.heartRate}
          </div>
        </div>
        <div className="p-2 bg-card rounded-lg">
          <div className="text-xs text-muted-foreground">BP</div>
          <div className="font-bold text-lg">
            {patient.vitals.bloodPressureSys}/{patient.vitals.bloodPressureDia}
          </div>
        </div>
        <div className="p-2 bg-card rounded-lg">
          <div className="text-xs text-muted-foreground">GCS</div>
          <div className="font-bold text-lg">{patient.vitals.gcs}</div>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-3 mb-4 p-4 bg-card rounded-lg animate-fade-in">
          <div>
            <div className="text-sm font-semibold text-muted-foreground">Temperature</div>
            <div>{patient.vitals.temperature}°F</div>
          </div>
          {patient.medicalHistory && (
            <div>
              <div className="text-sm font-semibold text-muted-foreground">Medical History</div>
              <div>{patient.medicalHistory.join(', ')}</div>
            </div>
          )}
          {patient.previousVisits && patient.previousVisits.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-muted-foreground">Previous Visits</div>
              {patient.previousVisits.map((visit, idx) => (
                <div key={idx} className="text-sm">
                  {visit.date} - {visit.hospital} - {visit.diagnosis}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-1"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
          {isExpanded ? 'Less' : 'More'} Details
        </Button>
        {alert.status === 'pending' && (
          <>
            <Button onClick={handleReject} variant="destructive" className="flex-1">
              <X className="w-4 h-4 mr-2" />
              Cannot Accept
            </Button>
            <Button onClick={handleAccept} className="flex-1 bg-stable hover:bg-stable/90">
              <Check className="w-4 h-4 mr-2" />
              Accept Case
            </Button>
          </>
        )}
        {alert.status === 'acknowledged' && (
          <Button onClick={handleAccept} className="flex-1 bg-stable hover:bg-stable/90">
            <Check className="w-4 h-4 mr-2" />
            Accept Case
          </Button>
        )}
      </div>
    </Card>
  );
};
