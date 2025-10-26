import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, Search, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
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
import { Badge } from '@/components/ui/badge';
import { medicalConditions } from '@/data/medicalConditions';

interface MultipleSymptomDropdownProps {
  values: string[];
  onChange: (values: string[]) => void;
  options?: any[];
  placeholder?: string;
}

export const MultipleSymptomDropdown = ({ 
  values, 
  onChange, 
  options = medicalConditions,
  placeholder = "Search or add symptoms..."
}: MultipleSymptomDropdownProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedConditions = useMemo(() => {
    return values.map(value => {
      // If using custom options array (strings), return them directly
      if (Array.isArray(options[0]) === false && typeof options[0] === 'string') {
        return { value, label: value, category: 'Equipment' };
      }
      
      // Otherwise, search through medicalConditions
      for (const cat of medicalConditions) {
        const found = cat.conditions.find(c => c.value === value);
        if (found) return { value, label: found.label, category: cat.category };
      }
      return { value, label: value, category: 'Other' };
    });
  }, [values, options]);

  const filteredCategories = useMemo(() => {
    // If using simple string array for options (like equipment)
    if (options && Array.isArray(options) && typeof options[0] === 'string') {
      const searchLower = search.toLowerCase();
      const filtered = search 
        ? options.filter((opt: string) => opt.toLowerCase().includes(searchLower))
        : options;
      
      return [{
        category: 'Available Options',
        conditions: filtered.map((opt: string) => ({ value: opt, label: opt, common: false }))
      }];
    }
    
    // Otherwise use medicalConditions structure
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
  }, [search, options]);

  const handleSelect = (conditionValue: string) => {
    const newValues = values.includes(conditionValue)
      ? values.filter(v => v !== conditionValue)
      : [...values, conditionValue];
    onChange(newValues);
  };

  const handleRemove = (valueToRemove: string) => {
    onChange(values.filter(v => v !== valueToRemove));
  };

  const handleAddCustom = () => {
    const trimmedSearch = search.trim();
    if (trimmedSearch && !values.includes(trimmedSearch)) {
      onChange([...values, trimmedSearch]);
      setSearch('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && search.trim()) {
      e.preventDefault();
      handleAddCustom();
    }
  };

  const hasExactMatch = useMemo(() => {
    if (!search) return true;
    const searchLower = search.toLowerCase().trim();
    
    // Check simple string options
    if (options && Array.isArray(options) && typeof options[0] === 'string') {
      return options.some((opt: string) => opt.toLowerCase() === searchLower);
    }
    
    // Check medicalConditions
    return medicalConditions.some(cat =>
      cat.conditions.some(c => c.label.toLowerCase() === searchLower)
    );
  }, [search, options]);

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-ambulance-card border-ambulance-border text-ambulance-text hover:bg-ambulance-card/80 min-h-[2.5rem] h-auto"
          >
            <div className="flex flex-wrap gap-1 flex-1">
              {selectedConditions.length > 0 ? (
                selectedConditions.map((condition) => (
                  <Badge
                    key={condition.value}
                    variant="secondary"
                    className="gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(condition.value);
                    }}
                  >
                    {condition.label}
                    <X className="h-3 w-3" />
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground">Select conditions or symptoms...</span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[500px] p-0 bg-ambulance-card border-ambulance-border z-50" align="start">
          <Command className="bg-ambulance-card">
            <div className="flex items-center border-b border-ambulance-border px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 text-white" />
              <input
                placeholder={placeholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex h-11 w-full bg-transparent py-3 text-sm outline-none text-white placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
              {search.trim() && !hasExactMatch && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleAddCustom}
                  className="ml-2 h-8 px-2 text-primary hover:text-primary hover:bg-primary/10"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              )}
            </div>
            <CommandList className="max-h-[400px] overflow-y-auto">
              {search.trim() && !hasExactMatch && (
                <div className="px-2 py-3 text-sm text-muted-foreground border-b border-ambulance-border">
                  Press <kbd className="px-2 py-1 text-xs bg-ambulance-border rounded">Enter</kbd> or click "Add" to add custom symptom: <span className="text-white font-medium">"{search}"</span>
                </div>
              )}
              <CommandEmpty className="text-white">No condition found in list. Type and press Enter to add custom.</CommandEmpty>
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
                        onSelect={() => handleSelect(condition.value)}
                        className="cursor-pointer hover:bg-ambulance-border text-white"
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            values.includes(condition.value) ? 'opacity-100' : 'opacity-0'
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
    </div>
  );
};
