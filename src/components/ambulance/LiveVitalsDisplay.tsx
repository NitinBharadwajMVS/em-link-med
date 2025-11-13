import { useEffect, useState } from 'react';
import { Activity, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';

interface LiveVitalsProps {
  onVitalsUpdate?: (spo2: number, heartRate: number) => void;
}

export const LiveVitalsDisplay = ({ onVitalsUpdate }: LiveVitalsProps) => {
  const { currentAmbulanceId } = useApp();
  const [spo2, setSpo2] = useState(98);
  const [heartRate, setHeartRate] = useState(72);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [, setTick] = useState(0);

  // Update the "X seconds ago" display every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Subscribe to live_vitals table and display whatever values are there
  useEffect(() => {
    if (!currentAmbulanceId) return;

    console.log('Setting up live vitals subscription for ambulance:', currentAmbulanceId);

    // Initial fetch
    const fetchVitals = async () => {
      const { data, error } = await supabase
        .from('live_vitals')
        .select('*')
        .eq('ambulance_id', currentAmbulanceId)
        .maybeSingle();

      if (!error && data) {
        const newSpo2 = data.spo2_pct || 98;
        const newHR = data.hr_bpm || 72;
        setSpo2(newSpo2);
        setHeartRate(newHR);
        setLastUpdate(new Date(data.updated_at));
        onVitalsUpdate?.(newSpo2, newHR);
        console.log('Initial vitals loaded:', { spo2: newSpo2, hr: newHR });
      } else {
        console.log('No vitals data found for ambulance:', currentAmbulanceId);
      }
    };

    fetchVitals();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`live-vitals-${currentAmbulanceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_vitals',
          filter: `ambulance_id=eq.${currentAmbulanceId}`
        },
        (payload) => {
          console.log('Live vitals update received:', payload);
          if (payload.new && typeof payload.new === 'object') {
            const data = payload.new as any;
            const newSpo2 = data.spo2_pct || 98;
            const newHR = data.hr_bpm || 72;
            setSpo2(newSpo2);
            setHeartRate(newHR);
            setLastUpdate(new Date(data.updated_at));
            onVitalsUpdate?.(newSpo2, newHR);
            console.log('Vitals updated:', { spo2: newSpo2, hr: newHR });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentAmbulanceId, onVitalsUpdate]);

  return (
    <div className="glass-effect p-6 rounded-xl border border-ambulance-border interactive-card group">
      <div className="flex items-center gap-2 mb-4 text-ambulance-text">
        <Activity className="w-5 h-5 text-primary animate-pulse" />
        <span className="font-semibold">Live Sensor Data</span>
        {lastUpdate && (
          <span className="text-xs text-muted-foreground ml-2">
            Updated {Math.floor((Date.now() - lastUpdate.getTime()) / 1000)}s ago
          </span>
        )}
        <div className="ml-auto flex gap-1">
          <div className="w-2 h-2 rounded-full animate-pulse bg-stable" />
          <div className="w-2 h-2 rounded-full animate-pulse [animation-delay:0.2s] bg-stable" />
          <div className="w-2 h-2 rounded-full animate-pulse [animation-delay:0.4s] bg-stable" />
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