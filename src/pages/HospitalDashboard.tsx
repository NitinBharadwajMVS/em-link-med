import { useEffect, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { AlertCard } from '@/components/hospital/AlertCard';
import { SimpleAlertMap } from '@/components/hospital/SimpleAlertMap';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Building2, AlertTriangle, Activity, CheckCircle, MapIcon } from 'lucide-react';
import { playAlertSound } from '@/utils/alertSounds';

const HospitalDashboard = () => {
  const { alerts } = useApp();
  const previousAlertCount = useRef(alerts.length);
  
  // Hospital location (NYC area - CityCare Hospital)
  const hospitalLocation = { lat: 40.7580, lng: -73.9855 };

  const criticalCount = alerts.filter(a => a.patient.triageLevel === 'critical' && a.status === 'pending').length;
  const urgentCount = alerts.filter(a => a.patient.triageLevel === 'urgent' && a.status === 'pending').length;
  const stableCount = alerts.filter(a => a.patient.triageLevel === 'stable' && a.status === 'pending').length;

  useEffect(() => {
    if (alerts.length > previousAlertCount.current) {
      const newAlert = alerts[alerts.length - 1];
      playAlertSound(newAlert.patient.triageLevel);
    }
    previousAlertCount.current = alerts.length;
  }, [alerts]);

  return (
    <div className="min-h-screen bg-hospital-bg p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Hospital Emergency Center</h1>
            <p className="text-muted-foreground">Real-time Ambulance Pre-Alerts</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <Card className="p-6 glass-effect border-critical/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Critical</div>
                <div className="text-4xl font-bold text-critical">{criticalCount}</div>
              </div>
              <AlertTriangle className="w-10 h-10 text-critical" />
            </div>
          </Card>

          <Card className="p-6 glass-effect border-urgent/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Urgent</div>
                <div className="text-4xl font-bold text-urgent">{urgentCount}</div>
              </div>
              <Activity className="w-10 h-10 text-urgent" />
            </div>
          </Card>

          <Card className="p-6 glass-effect border-stable/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Stable</div>
                <div className="text-4xl font-bold text-stable">{stableCount}</div>
              </div>
              <CheckCircle className="w-10 h-10 text-stable" />
            </div>
          </Card>
        </div>

        <Card className="p-6 mb-8 glass-effect animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <MapIcon className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-bold">Live Ambulance Tracking</h3>
          </div>
          <SimpleAlertMap
            hospitalPosition={[hospitalLocation.lat, hospitalLocation.lng]}
            ambulances={alerts
              .filter(alert => alert.ambulanceLocation)
              .map(alert => ({
                id: alert.ambulanceId,
                position: [alert.ambulanceLocation!.lat, alert.ambulanceLocation!.lng] as [number, number],
                patientName: alert.patient.name,
                triageLevel: alert.patient.triageLevel,
                eta: alert.eta,
              }))}
          />
        </Card>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Incoming Alerts</h2>
          <Badge variant="secondary" className="text-sm">
            {alerts.length} Total Alerts
          </Badge>
        </div>

        <div className="space-y-4">
          {alerts.length === 0 ? (
            <Card className="p-12 text-center glass-effect">
              <div className="text-muted-foreground">
                No incoming alerts at this time. System is monitoring...
              </div>
            </Card>
          ) : (
            alerts
              .sort((a, b) => {
                const priority = { critical: 3, urgent: 2, stable: 1 };
                return priority[b.patient.triageLevel] - priority[a.patient.triageLevel];
              })
              .map(alert => <AlertCard key={alert.id} alert={alert} />)
          )}
        </div>
      </div>
    </div>
  );
};

export default HospitalDashboard;
