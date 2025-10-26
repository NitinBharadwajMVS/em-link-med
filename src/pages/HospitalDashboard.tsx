import { useEffect, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { AlertCard } from '@/components/hospital/AlertCard';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Building2, AlertTriangle, Activity, CheckCircle } from 'lucide-react';
import { playAlertSound } from '@/utils/alertSounds';

const HospitalDashboard = () => {
  const { alerts } = useApp();
  const previousAlertCount = useRef(alerts.length);

  const activeAlerts = alerts.filter(a => a.status !== 'completed');
  const completedAlerts = alerts.filter(a => a.status === 'completed');

  const criticalCount = activeAlerts.filter(a => a.patient.triageLevel === 'critical' && a.status === 'pending').length;
  const urgentCount = activeAlerts.filter(a => a.patient.triageLevel === 'urgent' && a.status === 'pending').length;
  const stableCount = activeAlerts.filter(a => a.patient.triageLevel === 'stable' && a.status === 'pending').length;

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

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Active Alerts</h2>
          <Badge variant="secondary" className="text-sm">
            {activeAlerts.length} Active
          </Badge>
        </div>

        <div className="space-y-4 mb-8">
          {activeAlerts.length === 0 ? (
            <Card className="p-12 text-center glass-effect">
              <div className="text-muted-foreground">
                No incoming alerts at this time. System is monitoring...
              </div>
            </Card>
          ) : (
            activeAlerts
              .sort((a, b) => {
                const priority = { critical: 3, urgent: 2, stable: 1 };
                return priority[b.patient.triageLevel] - priority[a.patient.triageLevel];
              })
              .map(alert => <AlertCard key={alert.id} alert={alert} />)
          )}
        </div>

        {completedAlerts.length > 0 && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Completed Cases</h2>
              <Badge variant="secondary" className="text-sm bg-stable/20 text-stable border-stable">
                {completedAlerts.length} Completed
              </Badge>
            </div>

            <div className="space-y-4">
              {completedAlerts.map(alert => (
                <Card key={alert.id} className="p-6 glass-effect border-stable/30 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-stable text-white px-4 py-1 rounded-bl-lg text-sm font-semibold flex items-center gap-2">
                    ✅ Patient Dropped
                    <span className="text-xs opacity-80">
                      {alert.completedAt && new Date(alert.completedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div className="mt-8">
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-xl font-bold">{alert.patient.name}</h3>
                      <Badge className={`${
                        alert.patient.triageLevel === 'critical' ? 'bg-critical' :
                        alert.patient.triageLevel === 'urgent' ? 'bg-urgent' : 'bg-stable'
                      } text-white`}>
                        {alert.patient.triageLevel.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Age:</span> {alert.patient.age}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Gender:</span> {alert.patient.gender}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Contact:</span> {alert.patient.contact}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Ambulance ID:</span> {alert.ambulanceId}
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-background/50 rounded-lg">
                      <h4 className="font-semibold mb-2">Vitals</h4>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>SpO₂: {alert.patient.vitals.spo2}%</div>
                        <div>HR: {alert.patient.vitals.heartRate} bpm</div>
                        <div>BP: {alert.patient.vitals.bloodPressureSys}/{alert.patient.vitals.bloodPressureDia}</div>
                        <div>Temp: {alert.patient.vitals.temperature}°F</div>
                        <div>GCS: {alert.patient.vitals.gcs}</div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <span className="text-muted-foreground">Complaint:</span> {alert.patient.complaint}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HospitalDashboard;
