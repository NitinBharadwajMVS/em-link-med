import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { medicalConditions } from '@/data/medicalConditions';

interface SymptomDropdownProps {
  value: string;
  onChange: (value: string, category?: string) => void;
}

export const SymptomDropdown = ({ value, onChange }: SymptomDropdownProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherText, setOtherText] = useState('');

  const selectedCondition = useMemo(() => {
    for (const cat of medicalConditions) {
      const found = cat.conditions.find(c => c.value === value);
      if (found) return { label: found.label, category: cat.category };
    }
    return value ? { label: value, category: 'Other' } : null;
  }, [value]);

  const filteredCategories = useMemo(() => {
    if (!search) return medicalConditions;
    
    const searchLower = search.toLowerCase();
    return medicalConditions
      .map(cat => ({
        ...cat,
        conditions: cat.conditions.filter(
          c => c.label.toLowerCase().includes(searchLower) ||
               cat.category.toLowerCase().includes(searchLower)
        ),
      }))
      .filter(cat => cat.conditions.length > 0);
  }, [search]);

  const handleSelect = (conditionValue: string, category: string) => {
    if (conditionValue === 'other') {
      setShowOtherInput(true);
      setOpen(false);
    } else {
      onChange(conditionValue, category);
      setOpen(false);
      setShowOtherInput(false);
    }
  };

  const handleOtherSubmit = () => {
    if (otherText.trim()) {
      onChange(otherText.trim(), 'Other');
      setShowOtherInput(false);
    }
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-ambulance-card border-ambulance-border text-ambulance-text hover:bg-ambulance-card/80"
          >
            {selectedCondition ? (
              <span className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  [{selectedCondition.category}]
                </span>
                {selectedCondition.label}
              </span>
            ) : (
              'Select condition or symptom...'
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[500px] p-0 bg-ambulance-card border-ambulance-border" align="start">
          <Command className="bg-ambulance-card">
            <div className="flex items-center border-b border-ambulance-border px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                placeholder="Search symptoms or conditions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex h-11 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <CommandList className="max-h-[400px] overflow-y-auto">
              <CommandEmpty>No condition found.</CommandEmpty>
              {filteredCategories.map((category) => (
                <CommandGroup
                  key={category.category}
                  heading={category.category}
                  className="text-ambulance-text"
                >
                  {category.conditions
                    .sort((a, b) => (b.common ? 1 : 0) - (a.common ? 1 : 0))
                    .map((condition) => (
                      <CommandItem
                        key={condition.value}
                        value={condition.value}
                        onSelect={() => handleSelect(condition.value, category.category)}
                        className="cursor-pointer hover:bg-ambulance-border"
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            value === condition.value ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <span className="flex-1">{condition.label}</span>
                        {condition.common && (
                          <span className="text-xs text-primary">Common</span>
                        )}
                      </CommandItem>
                    ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {showOtherInput && (
        <div className="space-y-2 animate-fade-in p-3 glass-effect rounded-lg">
          <Label className="text-sm">Specify other condition</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Enter condition details..."
              className="bg-ambulance-card border-ambulance-border"
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleOtherSubmit()}
              autoFocus
            />
            <Button onClick={handleOtherSubmit} size="sm">
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
