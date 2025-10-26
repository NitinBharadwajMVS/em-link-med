import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Ambulance, Building2, Activity } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: 'linear-gradient(135deg, hsl(220, 40%, 8%) 0%, hsl(210, 80%, 50%) 100%)',
      }}
    >
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/10 mb-6 glow-critical">
            <Activity className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Smart Emergency System
          </h1>
          <p className="text-xl text-white/80">
            Seamless Ambulance-Hospital Coordination Platform
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-8 glass-effect hover:scale-105 transition-transform cursor-pointer"
            onClick={() => navigate('/ambulance-login')}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-critical/20 flex items-center justify-center mb-4 glow-critical">
                <Ambulance className="w-10 h-10 text-critical" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Ambulance Team</h2>
              <p className="text-white/70 mb-6">
                Log patient vitals and send pre-alerts to hospitals in real-time
              </p>
              <Button className="w-full bg-critical hover:bg-critical/90">
                Access Ambulance Interface
              </Button>
            </div>
          </Card>

          <Card className="p-8 glass-effect hover:scale-105 transition-transform cursor-pointer"
            onClick={() => navigate('/hospital-login')}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-stable/20 flex items-center justify-center mb-4 glow-stable">
                <Building2 className="w-10 h-10 text-stable" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Hospital Staff</h2>
              <p className="text-white/70 mb-6">
                Receive and manage incoming emergency alerts and patient data
              </p>
              <Button className="w-full bg-stable hover:bg-stable/90">
                View Hospital Dashboard
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
