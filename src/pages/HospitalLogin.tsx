import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/contexts/AppContext';
import { Building2 } from 'lucide-react';
import { toast } from 'sonner';

const HospitalLogin = () => {
  const [hospitalId, setHospitalId] = useState('');
  const [passcode, setPasscode] = useState('');
  const { login } = useApp();
  const navigate = useNavigate();

  const handleLogin = () => {
    if (!hospitalId || !passcode) {
      toast.error('Please enter hospital ID and passcode');
      return;
    }
    login(hospitalId);
    toast.success('Login successful');
    navigate('/hospital');
  };

  return (
    <div className="min-h-screen bg-hospital-bg flex items-center justify-center p-6"
      style={{
        background: 'linear-gradient(135deg, hsl(142, 40%, 8%) 0%, hsl(142, 45%, 12%) 100%)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="w-full max-w-md glass-effect p-8 rounded-2xl border border-hospital-border">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-hospital-accent/20 flex items-center justify-center mb-4">
            <Building2 className="w-10 h-10 text-hospital-accent" />
          </div>
          <h1 className="text-3xl font-bold text-hospital-text mb-2">Hospital Login</h1>
          <p className="text-muted-foreground">Smart Emergency Response System</p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="hospitalId" className="text-hospital-text">Hospital ID</Label>
            <Input
              id="hospitalId"
              placeholder="Enter hospital ID (e.g., HOSP001)"
              className="bg-hospital-card border-hospital-border text-hospital-text"
              value={hospitalId}
              onChange={(e) => setHospitalId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <div>
            <Label htmlFor="passcode" className="text-hospital-text">Passcode</Label>
            <Input
              id="passcode"
              type="password"
              placeholder="Enter passcode"
              className="bg-hospital-card border-hospital-border text-hospital-text"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <Button
            onClick={handleLogin}
            className="w-full h-12 text-lg font-semibold bg-hospital-accent hover:bg-hospital-accent/90"
          >
            Sign In
          </Button>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/ambulance-login')}
            className="text-sm text-hospital-accent hover:underline"
          >
            Ambulance Team? Click here
          </button>
        </div>
      </div>
    </div>
  );
};

export default HospitalLogin;
