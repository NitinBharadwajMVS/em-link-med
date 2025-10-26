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
    <div className="glass-effect p-6 rounded-xl border border-ambulance-border interactive-card group">
      <div className="flex items-center gap-2 mb-4 text-ambulance-text">
        <Activity className="w-5 h-5 text-primary animate-pulse" />
        <span className="font-semibold">Live Sensor Data (MAX30102)</span>
        <div className="ml-auto flex gap-1">
          <div className="w-2 h-2 rounded-full bg-stable animate-pulse" />
          <div className="w-2 h-2 rounded-full bg-stable animate-pulse [animation-delay:0.2s]" />
          <div className="w-2 h-2 rounded-full bg-stable animate-pulse [animation-delay:0.4s]" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="text-center p-4 rounded-lg bg-ambulance-bg/30 transition-all duration-300 hover:bg-ambulance-bg/50">
          <div className="text-sm text-muted-foreground mb-2">SpO₂</div>
          <div className={cn(
            "text-5xl font-bold transition-all duration-500 animate-pulse-glow",
            "group-hover:scale-110",
            spo2 < 94 ? "text-critical" : "text-stable"
          )}>
            {spo2}%
          </div>
          <div className="mt-2 h-1 bg-ambulance-border rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-500",
                spo2 < 94 ? "bg-critical" : "bg-stable"
              )}
              style={{ width: `${spo2}%` }}
            />
          </div>
        </div>
        <div className="text-center p-4 rounded-lg bg-ambulance-bg/30 transition-all duration-300 hover:bg-ambulance-bg/50">
          <div className="text-sm text-muted-foreground mb-2 flex items-center justify-center gap-1">
            <Heart className="w-4 h-4 animate-pulse" />
            Heart Rate
          </div>
          <div className={cn(
            "text-5xl font-bold transition-all duration-500 animate-pulse-glow",
            "group-hover:scale-110",
            heartRate > 100 ? "text-urgent" : "text-stable"
          )}>
            {heartRate}
          </div>
          <div className="mt-2 h-1 bg-ambulance-border rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-500",
                heartRate > 100 ? "bg-urgent" : "bg-stable"
              )}
              style={{ width: `${Math.min(heartRate / 2, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
