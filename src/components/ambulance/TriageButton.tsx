import { TriageLevel } from '@/types/patient';
import { cn } from '@/lib/utils';
import { AlertTriangle, Activity, CheckCircle } from 'lucide-react';

interface TriageButtonProps {
  level: TriageLevel;
  onClick: () => void;
  isActive: boolean;
}

export const TriageButton = ({ level, onClick, isActive }: TriageButtonProps) => {
  const config = {
    critical: {
      label: 'CRITICAL',
      icon: AlertTriangle,
      bgClass: 'bg-critical hover:bg-critical/90',
      glowClass: 'glow-critical',
      activeClass: 'ring-4 ring-critical/50',
    },
    urgent: {
      label: 'URGENT',
      icon: Activity,
      bgClass: 'bg-urgent hover:bg-urgent/90',
      glowClass: 'glow-urgent',
      activeClass: 'ring-4 ring-urgent/50',
    },
    stable: {
      label: 'STABLE',
      icon: CheckCircle,
      bgClass: 'bg-stable hover:bg-stable/90',
      glowClass: 'glow-stable',
      activeClass: 'ring-4 ring-stable/50',
    },
  };

  const { label, icon: Icon, bgClass, glowClass, activeClass } = config[level];

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 min-w-[200px] h-32 rounded-2xl transition-all duration-300',
        'flex flex-col items-center justify-center gap-3',
        'text-white font-bold text-xl tracking-wider',
        bgClass,
        isActive && glowClass,
        isActive && activeClass,
        'hover:scale-105 hover:shadow-2xl'
      )}
    >
      <Icon className="w-12 h-12" />
      <span>{label}</span>
    </button>
  );
};
