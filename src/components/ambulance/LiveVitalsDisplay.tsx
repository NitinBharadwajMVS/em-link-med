import { useEffect, useState } from 'react';
import { Activity, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LiveVitalsProps {
  onVitalsUpdate?: (spo2: number, heartRate: number) => void;
}

export const LiveVitalsDisplay = ({ onVitalsUpdate }: LiveVitalsProps) => {
  const [spo2, setSpo2] = useState(98);
  const [heartRate, setHeartRate] = useState(72);

  useEffect(() => {
    const interval = setInterval(() => {
      const newSpo2 = Math.floor(Math.random() * 5) + 95;
      const newHR = Math.floor(Math.random() * 20) + 65;
      setSpo2(newSpo2);
      setHeartRate(newHR);
      onVitalsUpdate?.(newSpo2, newHR);
    }, 3000);

    return () => clearInterval(interval);
  }, [onVitalsUpdate]);

  return (
    <div className="glass-effect p-6 rounded-xl border border-ambulance-border">
      <div className="flex items-center gap-2 mb-4 text-ambulance-text">
        <Activity className="w-5 h-5 text-primary" />
        <span className="font-semibold">Live Sensor Data (MAX30102)</span>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-2">SpO₂</div>
          <div className={cn(
            "text-5xl font-bold transition-all duration-500 animate-pulse-glow",
            spo2 < 94 ? "text-critical" : "text-stable"
          )}>
            {spo2}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-2 flex items-center justify-center gap-1">
            <Heart className="w-4 h-4" />
            Heart Rate
          </div>
          <div className={cn(
            "text-5xl font-bold transition-all duration-500 animate-pulse-glow",
            heartRate > 100 ? "text-urgent" : "text-stable"
          )}>
            {heartRate}
          </div>
        </div>
      </div>
    </div>
  );
};
