import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/contexts/AppContext';
import { Ambulance } from 'lucide-react';
import { toast } from 'sonner';

const AmbulanceLogin = () => {
  const [ambulanceId, setAmbulanceId] = useState('');
  const [passcode, setPasscode] = useState('');
  const { login } = useApp();
  const navigate = useNavigate();

  const handleLogin = () => {
    if (!ambulanceId || !passcode) {
      toast.error('Please enter ambulance ID and passcode');
      return;
    }
    login(ambulanceId);
    toast.success('Login successful');
    navigate('/ambulance');
  };

  return (
    <div className="min-h-screen bg-ambulance-bg flex items-center justify-center p-6"
      style={{
        background: 'linear-gradient(135deg, hsl(220, 40%, 8%) 0%, hsl(220, 45%, 12%) 100%)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="w-full max-w-md glass-effect p-8 rounded-2xl border border-ambulance-border">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-4 glow-critical">
            <Ambulance className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-ambulance-text mb-2">Ambulance Login</h1>
          <p className="text-muted-foreground">Smart Emergency Response System</p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="ambulanceId" className="text-ambulance-text">Ambulance ID</Label>
            <Input
              id="ambulanceId"
              placeholder="Enter ambulance ID (e.g., AMB123)"
              className="bg-ambulance-card border-ambulance-border text-ambulance-text"
              value={ambulanceId}
              onChange={(e) => setAmbulanceId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <div>
            <Label htmlFor="passcode" className="text-ambulance-text">Passcode</Label>
            <Input
              id="passcode"
              type="password"
              placeholder="Enter passcode"
              className="bg-ambulance-card border-ambulance-border text-ambulance-text"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <Button
            onClick={handleLogin}
            className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 glow-critical"
          >
            Sign In
          </Button>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/hospital')}
            className="text-sm text-primary hover:underline"
          >
            Hospital Staff? Click here
          </button>
        </div>
      </div>
    </div>
  );
};

export default AmbulanceLogin;
