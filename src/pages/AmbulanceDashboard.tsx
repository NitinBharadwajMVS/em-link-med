import { useState } from 'react';
import { TriageButton } from '@/components/ambulance/TriageButton';
import { PatientForm } from '@/components/ambulance/PatientForm';
import { PatientHistoryDialog } from '@/components/history/PatientHistoryDialog';
import { HospitalSelector } from '@/components/ambulance/HospitalSelector';
import { TriageLevel } from '@/types/patient';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { LogOut, Ambulance, CheckCircle, AlertCircle, Clock, Building2 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { calculateETA } from '@/utils/distanceCalculator';

const AmbulanceDashboard = () => {
  const [selectedTriage, setSelectedTriage] = useState<TriageLevel | null>(null);
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);
  const { logout, alerts, completeCase, currentUser, hospitals, changeHospital, addHospital, importHospitals } = useApp();
  const navigate = useNavigate();
  const { toast } = useToast();

  const activeAlerts = alerts.filter(
    alert => alert.ambulanceId === currentUser && alert.status !== 'completed'
  );

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handlePatientDropped = (alertId: string) => {
    completeCase(alertId);
    toast({
      title: "Patient Dropped Successfully",
      description: "Case marked as completed.",
    });
  };

  const handleChangeHospital = (alertId: string, newHospitalId: string) => {
    const alert = alerts.find(a => a.id === alertId);
    const newHospital = hospitals.find(h => h.id === newHospitalId);
    
    if (alert && newHospital) {
      changeHospital(alertId, newHospitalId, 'Ambulance crew changed hospital selection');
      toast({
        title: "Hospital Changed",
        description: `Pre-alert resent to ${newHospital.name}`,
      });
      setEditingAlertId(null);
    }
  };

  return (
    <div
      className="min-h-screen p-6"
      style={{
        background: 'linear-gradient(135deg, hsl(220, 40%, 8%) 0%, hsl(220, 45%, 15%) 100%)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center glow-critical">
              <Ambulance className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-ambulance-text">Emergency Response</h1>
              <p className="text-muted-foreground">Smart Ambulance Interface</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <PatientHistoryDialog 
              alerts={alerts} 
              title="Patient History" 
              variant="ambulance"
            />
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-ambulance-border hover:bg-ambulance-card"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <div className="flex gap-6 mb-8">
          <TriageButton
            level="critical"
            onClick={() => setSelectedTriage('critical')}
            isActive={selectedTriage === 'critical'}
          />
          <TriageButton
            level="urgent"
            onClick={() => setSelectedTriage('urgent')}
            isActive={selectedTriage === 'urgent'}
          />
          <TriageButton
            level="stable"
            onClick={() => setSelectedTriage('stable')}
            isActive={selectedTriage === 'stable'}
          />
        </div>

        {selectedTriage && (
          <Card className="p-8 bg-ambulance-card border-ambulance-border text-ambulance-text animate-slide-in interactive-card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold capitalize">{selectedTriage} Patient Entry</h2>
              <Button
                variant="ghost"
                onClick={() => setSelectedTriage(null)}
                className="text-muted-foreground hover:text-ambulance-text transition-all duration-300 hover:scale-110"
              >
                Close
              </Button>
            </div>
            <PatientForm triageLevel={selectedTriage} onClose={() => setSelectedTriage(null)} />
          </Card>
        )}

        {activeAlerts.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-ambulance-text mb-4">Active Pre-Alerts</h2>
            <div className="space-y-4">
              {activeAlerts.map((alert) => {
                const hospital = hospitals.find(h => h.id === alert.hospitalId);
                const isDeclined = alert.status === 'declined';
                
                return (
                  <Card key={alert.id} className={`p-6 bg-ambulance-card border-ambulance-border text-ambulance-text ${isDeclined ? 'border-critical/50' : ''}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-bold">{alert.patient.name}</h3>
                          <Badge className={`${
                            alert.patient.triageLevel === 'critical' ? 'bg-critical' :
                            alert.patient.triageLevel === 'urgent' ? 'bg-urgent' : 'bg-stable'
                          } text-white`}>
                            {alert.patient.triageLevel.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="border-ambulance-border">
                            {alert.status === 'pending' ? '⏳ Pending' :
                             alert.status === 'acknowledged' ? '👁️ Acknowledged' :
                             alert.status === 'declined' ? '❌ Declined' : '✅ Accepted'}
                          </Badge>
                        </div>

                        {isDeclined && (
                          <div className="mb-3 p-3 bg-critical/10 border border-critical/30 rounded-lg flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-critical mt-0.5" />
                            <div className="flex-1">
                              <div className="font-semibold text-critical">Selected hospital declined</div>
                              <div className="text-sm text-muted-foreground">{alert.declineReason}</div>
                              <Button
                                onClick={() => setEditingAlertId(alert.id)}
                                size="sm"
                                className="mt-2 bg-primary hover:bg-primary/90"
                              >
                                Choose Next Hospital
                              </Button>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
                          <div>Age: {alert.patient.age} • {alert.patient.gender}</div>
                          <div>Contact: {alert.patient.contact}</div>
                          <div>Complaint: {alert.patient.complaint}</div>
                          <div>ETA: {alert.eta} min</div>
                        </div>

                        {hospital && (
                          <div className="mb-3 p-3 bg-ambulance-border/30 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-primary" />
                                <span className="font-semibold">{hospital.name}</span>
                              </div>
                              {alert.status !== 'completed' && (
                                <Button
                                  onClick={() => setEditingAlertId(alert.id)}
                                  variant="outline"
                                  size="sm"
                                  className="border-ambulance-border hover:bg-ambulance-card"
                                >
                                  Change Hospital
                                </Button>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <div>{hospital.address}</div>
                              {hospital.contact && <div>📞 {hospital.contact}</div>}
                              <div className="flex gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {hospital.distance} km
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {calculateETA(hospital.distance)} min
                                </Badge>
                              </div>
                              {hospital.equipment && hospital.equipment.length > 0 && (
                                <div className="mt-2">
                                  <div className="text-xs font-semibold mb-1">Equipment:</div>
                                  <div className="flex flex-wrap gap-1">
                                    {hospital.equipment.map((eq) => (
                                      <Badge key={eq} variant="secondary" className="text-xs">
                                        {eq}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {alert.auditLog && alert.auditLog.length > 1 && (
                          <details className="mt-3">
                            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-ambulance-text">
                              View Change History ({alert.auditLog.length} events)
                            </summary>
                            <div className="mt-2 space-y-1 text-xs">
                              {alert.auditLog.map((log, idx) => (
                                <div key={idx} className="p-2 bg-ambulance-border/20 rounded">
                                  <div className="font-semibold">{log.action}</div>
                                  <div className="text-muted-foreground">{log.details}</div>
                                  <div className="text-muted-foreground text-xs mt-1">
                                    {new Date(log.timestamp).toLocaleString()} • {log.actor}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                      </div>

                      {alert.status === 'accepted' && (
                        <Button
                          onClick={() => handlePatientDropped(alert.id)}
                          className="bg-stable hover:bg-stable/90 text-white ml-4"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Patient Dropped
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        <Dialog open={!!editingAlertId} onOpenChange={(open) => !open && setEditingAlertId(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-ambulance-card border-ambulance-border">
            <DialogHeader>
              <DialogTitle className="text-ambulance-text">Change Hospital</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Select a new hospital to send the pre-alert. The previous hospital will be notified.
              </DialogDescription>
            </DialogHeader>
            {editingAlertId && (
              <HospitalSelector
                hospitals={hospitals}
                selectedHospitalId={alerts.find(a => a.id === editingAlertId)?.hospitalId}
                onSelect={(hospital) => handleChangeHospital(editingAlertId, hospital.id)}
                requiredEquipment={alerts.find(a => a.id === editingAlertId)?.requiredEquipment}
                alertId={editingAlertId}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AmbulanceDashboard;
