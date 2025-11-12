import { useState, useEffect } from 'react';
import { Alert } from '@/types/patient';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Activity, Clock, User, Phone, ChevronDown, ChevronUp, Check, XCircle, AlertTriangle } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AlertCardProps {
  alert: Alert;
}

export const AlertCard = ({ alert }: AlertCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [isDeclineDialogOpen, setIsDeclineDialogOpen] = useState(false);
  const [liveVitals, setLiveVitals] = useState<{ spo2: number; heartRate: number } | null>(null);
  const { updateAlertStatus, hospitals } = useApp();
  const { patient } = alert;

  const hospital = hospitals.find(h => h.id === alert.hospitalId);

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
    toast.success('Patient case accepted');
  };

  const handleDecline = () => {
    if (!declineReason.trim()) {
      toast.error('Please provide a reason for declining');
      return;
    }
    updateAlertStatus(alert.id, 'declined', declineReason);
    toast.success('Alert declined - ambulance will be notified');
    setIsDeclineDialogOpen(false);
    setDeclineReason('');
  };

  // Subscribe to live vitals when alert is acknowledged or accepted
  useEffect(() => {
    if (alert.status !== 'acknowledged' && alert.status !== 'accepted') {
      return;
    }

    console.log('Setting up live vitals subscription for ambulance:', alert.ambulanceId);

    const channel = supabase
      .channel(`live-vitals-${alert.ambulanceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_vitals',
          filter: `ambulance_id=eq.${alert.ambulanceId}`
        },
        (payload) => {
          console.log('Live vitals update:', payload);
          if (payload.new && typeof payload.new === 'object') {
            const data = payload.new as any;
            setLiveVitals({
              spo2: data.spo2_pct || patient.vitals.spo2,
              heartRate: data.hr_bpm || patient.vitals.heartRate
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [alert.status, alert.ambulanceId, patient.vitals.spo2, patient.vitals.heartRate]);

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
        <div className="mb-4 p-3 bg-card rounded-lg">
          <div className="text-sm font-semibold text-muted-foreground mb-2">Required Equipment:</div>
          <div className="flex flex-wrap gap-2">
            {alert.requiredEquipment.map((eq) => (
              <Badge
                key={eq}
                variant="secondary"
                className="text-xs"
              >
                {eq}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3 mb-4 text-center">
        <div className="p-2 bg-card rounded-lg">
          <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            SpO₂ {liveVitals && <span className="text-[10px] text-stable">●LIVE</span>}
          </div>
          <div className={cn("font-bold text-lg", (liveVitals?.spo2 || patient.vitals.spo2) < 94 && "text-critical")}>
            {liveVitals?.spo2 || patient.vitals.spo2}%
          </div>
        </div>
        <div className="p-2 bg-card rounded-lg">
          <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            HR {liveVitals && <span className="text-[10px] text-stable">●LIVE</span>}
          </div>
          <div className={cn("font-bold text-lg", (liveVitals?.heartRate || patient.vitals.heartRate) > 100 && "text-urgent")}>
            {liveVitals?.heartRate || patient.vitals.heartRate}
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
            <Button onClick={handleAcknowledge} variant="secondary" className="flex-1">
              <Activity className="w-4 h-4 mr-2" />
              Acknowledge
            </Button>
            
            <AlertDialog open={isDeclineDialogOpen} onOpenChange={setIsDeclineDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="flex-1">
                  <XCircle className="w-4 h-4 mr-2" />
                  Decline
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Decline Pre-Alert</AlertDialogTitle>
                  <AlertDialogDescription>
                    Please provide a reason for declining this alert. The ambulance will be notified immediately.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="my-4">
                  <Textarea
                    placeholder="E.g., No available ICU beds, Missing required equipment (Ventilator), Emergency department at capacity..."
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDecline} className="bg-critical hover:bg-critical/90">
                    Decline Alert
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}

        {(alert.status === 'pending' || alert.status === 'acknowledged') && (
          <Button onClick={handleAccept} className="flex-1 bg-stable hover:bg-stable/90">
            <Check className="w-4 h-4 mr-2" />
            Accept
          </Button>
        )}
      </div>
    </Card>
  );
};
