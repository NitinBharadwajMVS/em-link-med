import { Hospital } from '@/types/patient';
import { Building2, Phone, Navigation, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getLocality } from '@/utils/distanceCalculator';

interface HospitalRowProps {
  hospital: Hospital;
  isSelected: boolean;
  onSelect: (hospital: Hospital) => void;
}

export const HospitalRow = ({ hospital, isSelected, onSelect }: HospitalRowProps) => {
  const distance = hospital.distance || 0;
  const eta = hospital.eta || 0;
  const locality = getLocality(hospital.address);

  const handleClick = () => {
    try {
      onSelect(hospital);
    } catch (error) {
      console.error('Error selecting hospital:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "p-4 transition-all border shadow-sm cursor-pointer min-h-[96px]",
        isSelected && "ring-2 ring-primary bg-primary/5 border-primary",
        !isSelected && "hover:border-primary/50 hover:shadow-md"
      )}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-base leading-tight line-clamp-2 break-words">
              {hospital.name}
            </h3>
            {isSelected && (
              <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-1 break-words">
            {locality}
          </p>
        </div>
      </div>

      <div className="space-y-2 mb-3">
        {hospital.contact && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <a 
              href={`tel:${hospital.contact}`} 
              className="hover:text-primary truncate"
              onClick={(e) => e.stopPropagation()}
            >
              {hospital.contact}
            </a>
          </div>
        )}
        
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="flex items-center gap-1">
            <Navigation className="w-3 h-3" />
            {distance > 0 ? distance.toFixed(2) : '—'} km
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {eta > 0 ? `${eta} min` : '—'}
          </Badge>
        </div>
      </div>

      <Button
        size="sm"
        variant={isSelected ? "default" : "outline"}
        className="w-full min-h-[44px] touch-manipulation"
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
      >
        {isSelected ? 'Selected' : 'Select'}
      </Button>
    </Card>
  );
};
