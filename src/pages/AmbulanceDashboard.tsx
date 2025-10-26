import { useState } from 'react';
import { TriageButton } from '@/components/ambulance/TriageButton';
import { PatientForm } from '@/components/ambulance/PatientForm';
import { TriageLevel } from '@/types/patient';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { LogOut, Ambulance } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

const AmbulanceDashboard = () => {
  const [selectedTriage, setSelectedTriage] = useState<TriageLevel | null>(null);
  const { logout } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
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
          <Button
            variant="outline"
            onClick={handleLogout}
            className="border-ambulance-border hover:bg-ambulance-card"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
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
          <Card className="p-8 bg-ambulance-card border-ambulance-border text-ambulance-text">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold capitalize">{selectedTriage} Patient Entry</h2>
              <Button
                variant="ghost"
                onClick={() => setSelectedTriage(null)}
                className="text-muted-foreground hover:text-ambulance-text"
              >
                Close
              </Button>
            </div>
            <PatientForm triageLevel={selectedTriage} onClose={() => setSelectedTriage(null)} />
          </Card>
        )}
      </div>
    </div>
  );
};

export default AmbulanceDashboard;
