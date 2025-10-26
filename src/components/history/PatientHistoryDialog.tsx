import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History } from 'lucide-react';
import { Alert } from '@/types/patient';
import { format } from 'date-fns';

interface PatientHistoryDialogProps {
  alerts: Alert[];
  title: string;
  variant?: 'ambulance' | 'hospital';
}

export const PatientHistoryDialog = ({ alerts, title, variant = 'hospital' }: PatientHistoryDialogProps) => {
  const completedAlerts = alerts.filter(a => a.status === 'completed');

  const getTriageColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-critical';
      case 'urgent':
        return 'bg-urgent';
      case 'stable':
        return 'bg-stable';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={variant === 'ambulance' ? 'border-ambulance-border hover:bg-ambulance-card' : ''}
        >
          <History className="w-4 h-4 mr-2" />
          History
          {completedAlerts.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {completedAlerts.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">{title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[600px] pr-4">
          {completedAlerts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No completed cases yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedAlerts
                .sort((a, b) => {
                  const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
                  const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
                  return dateB - dateA;
                })
                .map((alert) => (
                  <Card key={alert.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold">{alert.patient.name}</h3>
                        <Badge className={`${getTriageColor(alert.patient.triageLevel)} text-white`}>
                          {alert.patient.triageLevel.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="bg-stable/10 text-stable border-stable">
                          ✅ Completed
                        </Badge>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div>
                          {alert.completedAt && format(new Date(alert.completedAt), 'MMM dd, yyyy')}
                        </div>
                        <div>
                          {alert.completedAt && format(new Date(alert.completedAt), 'hh:mm a')}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Age</div>
                        <div className="font-semibold">{alert.patient.age} years</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Gender</div>
                        <div className="font-semibold capitalize">{alert.patient.gender}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Contact</div>
                        <div className="font-semibold">{alert.patient.contact}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Ambulance ID</div>
                        <div className="font-semibold">{alert.ambulanceId}</div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="text-sm text-muted-foreground mb-1">Chief Complaint</div>
                      <div className="font-semibold">{alert.patient.complaint}</div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-muted/30 rounded-lg">
                      <div>
                        <div className="text-xs text-muted-foreground">SpO₂</div>
                        <div className="font-semibold">{alert.patient.vitals.spo2}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Heart Rate</div>
                        <div className="font-semibold">{alert.patient.vitals.heartRate} bpm</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Blood Pressure</div>
                        <div className="font-semibold">
                          {alert.patient.vitals.bloodPressureSys}/{alert.patient.vitals.bloodPressureDia}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Temperature</div>
                        <div className="font-semibold">{alert.patient.vitals.temperature}°F</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">GCS</div>
                        <div className="font-semibold">{alert.patient.vitals.gcs}</div>
                      </div>
                      {alert.patient.vitals.respiratoryRate && (
                        <div>
                          <div className="text-xs text-muted-foreground">Resp. Rate</div>
                          <div className="font-semibold">{alert.patient.vitals.respiratoryRate}</div>
                        </div>
                      )}
                    </div>

                    {alert.patient.medicalHistory && alert.patient.medicalHistory.length > 0 && (
                      <div className="mt-4">
                        <div className="text-sm text-muted-foreground mb-1">Medical History</div>
                        <div className="flex flex-wrap gap-2">
                          {alert.patient.medicalHistory.map((item, idx) => (
                            <Badge key={idx} variant="outline">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
                      <div className="text-muted-foreground">
                        Alert sent: {format(new Date(alert.timestamp), 'MMM dd, hh:mm a')}
                      </div>
                      <div className="text-muted-foreground">
                        ETA: {alert.eta} minutes
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
