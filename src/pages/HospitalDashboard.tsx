import { useEffect, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, AlertTriangle, Activity, CheckCircle, Phone } from 'lucide-react';
import { playAlertSound } from '@/utils/alertSounds';
import { HospitalMap } from '@/components/maps/HospitalMap';
import { useToast } from '@/hooks/use-toast';

const HospitalDashboard = () => {
  const { alerts, updateAlertStatus, updateHospitalStatus } = useApp();
  const previousAlertCount = useRef(alerts.length);
  const { toast } = useToast();

  // Mock hospital position - would come from hospital settings in real app
  const hospitalPosition = { lat: 40.7489, lng: -73.9680 };

  const criticalCount = alerts.filter(a => a.patient.triageLevel === 'critical' && a.status === 'pending').length;
  const urgentCount = alerts.filter(a => a.patient.triageLevel === 'urgent' && a.status === 'pending').length;
  const stableCount = alerts.filter(a => a.patient.triageLevel === 'stable' && a.status === 'pending').length;

  useEffect(() => {
    if (alerts.length > previousAlertCount.current) {
      const newAlert = alerts[alerts.length - 1];
      playAlertSound(newAlert.patient.triageLevel);
      toast({
        title: "New incoming alert",
        description: `${newAlert.ambulanceId} - ${newAlert.patient.triageLevel.toUpperCase()} patient`,
      });
    }
    previousAlertCount.current = alerts.length;
  }, [alerts, toast]);

  const handleAccept = (alertId: string) => {
    updateAlertStatus(alertId, 'accepted');
    toast({
      title: "Alert accepted",
      description: "Preparing to receive patient",
    });
  };

  const handleDecline = (alertId: string, hospitalId: string) => {
    updateAlertStatus(alertId, 'declined');
    updateHospitalStatus(hospitalId, 'unavailable');
    toast({
      title: "Alert declined",
      description: "Hospital marked as unavailable. Ambulance will be notified.",
      variant: "destructive",
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Hospital Emergency Center</h1>
            <p className="text-sm text-muted-foreground">Real-time Ambulance Pre-Alerts</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4 border-critical/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Critical</div>
                <div className="text-3xl font-bold text-critical">{criticalCount}</div>
              </div>
              <AlertTriangle className="w-8 h-8 text-critical" />
            </div>
          </Card>

          <Card className="p-4 border-urgent/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Urgent</div>
                <div className="text-3xl font-bold text-urgent">{urgentCount}</div>
              </div>
              <Activity className="w-8 h-8 text-urgent" />
            </div>
          </Card>

          <Card className="p-4 border-stable/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Stable</div>
                <div className="text-3xl font-bold text-stable">{stableCount}</div>
              </div>
              <CheckCircle className="w-8 h-8 text-stable" />
            </div>
          </Card>
        </div>

        {/* Map */}
        <Card className="p-0 overflow-hidden h-[400px] mb-6">
          <HospitalMap hospitalPosition={hospitalPosition} alerts={alerts} />
        </Card>

        {/* Alerts List */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Incoming Alerts</h2>
          <Badge variant="secondary">
            {alerts.filter(a => a.status === 'pending').length} Pending
          </Badge>
        </div>

        <div className="space-y-4">
          {alerts.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="text-muted-foreground">
                No incoming alerts. System is monitoring...
              </div>
            </Card>
          ) : (
            alerts
              .sort((a, b) => {
                const priority = { critical: 3, urgent: 2, stable: 1 };
                return priority[b.patient.triageLevel] - priority[a.patient.triageLevel];
              })
              .map(alert => (
                <Card
                  key={alert.id}
                  className={`p-6 ${
                    alert.patient.triageLevel === 'critical' ? 'border-critical/50 bg-critical/5' :
                    alert.patient.triageLevel === 'urgent' ? 'border-urgent/50 bg-urgent/5' :
                    'border-stable/50 bg-stable/5'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Alert Info */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-lg">{alert.ambulanceId}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            <a href={`tel:${alert.ambulanceContact}`} className="hover:text-primary">
                              {alert.ambulanceContact}
                            </a>
                          </div>
                        </div>
                        <Badge
                          variant={
                            alert.patient.triageLevel === 'critical' ? 'destructive' :
                            alert.patient.triageLevel === 'urgent' ? 'default' :
                            'secondary'
                          }
                        >
                          {alert.patient.triageLevel.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-semibold mb-1">Patient</div>
                          <div className="text-sm">{alert.patient.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {alert.patient.age}y, {alert.patient.gender}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-semibold mb-1">ETA / Distance</div>
                          <div className="text-sm">{alert.eta} minutes</div>
                          <div className="text-xs text-muted-foreground">
                            {(alert.distance / 1000).toFixed(1)} km
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-semibold mb-1">Vitals</div>
                        <div className="flex flex-wrap gap-3 text-xs">
                          <span>SpO2: {alert.patient.vitals.spo2}%</span>
                          <span>HR: {alert.patient.vitals.heartRate} bpm</span>
                          <span>BP: {alert.patient.vitals.bloodPressureSys}/{alert.patient.vitals.bloodPressureDia}</span>
                          <span>Temp: {alert.patient.vitals.temperature}°F</span>
                          <span>GCS: {alert.patient.vitals.gcs}</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-semibold mb-1">Equipment On Board</div>
                        <div className="text-xs text-muted-foreground">
                          {alert.ambulanceEquipment.join(', ')}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {alert.status === 'pending' && (
                      <div className="flex flex-col gap-3 lg:min-w-[150px]">
                        <Button
                          onClick={() => handleAccept(alert.id)}
                          className="w-full"
                          size="lg"
                        >
                          Accept
                        </Button>
                        <Button
                          onClick={() => handleDecline(alert.id, alert.hospitalId)}
                          variant="destructive"
                          className="w-full"
                          size="lg"
                        >
                          Decline
                        </Button>
                      </div>
                    )}

                    {alert.status === 'accepted' && (
                      <div className="flex items-center justify-center lg:min-w-[150px]">
                        <Badge variant="default" className="text-sm">
                          Accepted
                        </Badge>
                      </div>
                    )}

                    {alert.status === 'declined' && (
                      <div className="flex items-center justify-center lg:min-w-[150px]">
                        <Badge variant="destructive" className="text-sm">
                          Declined
                        </Badge>
                      </div>
                    )}
                  </div>
                </Card>
              ))
          )}
        </div>
      </div>
    </div>
  );
};

export default HospitalDashboard;
