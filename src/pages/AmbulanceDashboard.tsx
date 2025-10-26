import { useState } from 'react';
import { TriageButton } from '@/components/ambulance/TriageButton';
import { PatientForm } from '@/components/ambulance/PatientForm';
import { PatientHistoryDialog } from '@/components/history/PatientHistoryDialog';
import { TriageLevel } from '@/types/patient';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { LogOut, Ambulance, CheckCircle } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const AmbulanceDashboard = () => {
  const [selectedTriage, setSelectedTriage] = useState<TriageLevel | null>(null);
  const { logout, alerts, completeCase, currentUser } = useApp();
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
              {activeAlerts.map((alert) => (
                <Card key={alert.id} className="p-6 bg-ambulance-card border-ambulance-border text-ambulance-text">
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
                           alert.status === 'acknowledged' ? '👁️ Acknowledged' : '✅ Accepted'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div>Age: {alert.patient.age} • {alert.patient.gender}</div>
                        <div>Contact: {alert.patient.contact}</div>
                        <div>Complaint: {alert.patient.complaint}</div>
                        <div>ETA: {alert.eta} min</div>
                      </div>
                    </div>
                    {alert.status === 'accepted' && (
                      <Button
                        onClick={() => handlePatientDropped(alert.id)}
                        className="bg-stable hover:bg-stable/90 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Patient Dropped
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AmbulanceDashboard;
