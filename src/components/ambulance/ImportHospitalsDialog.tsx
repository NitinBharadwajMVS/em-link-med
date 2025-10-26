import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Hospital } from '@/types/patient';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';

interface ImportHospitalsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (hospitals: Hospital[]) => void;
}

export const ImportHospitalsDialog = ({ open, onOpenChange, onImport }: ImportHospitalsDialogProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const processFile = (file: File) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        let hospitals: Hospital[];

        if (file.name.endsWith('.json')) {
          hospitals = JSON.parse(content);
        } else if (file.name.endsWith('.csv')) {
          // Simple CSV parsing
          const lines = content.split('\n');
          const headers = lines[0].split(',').map(h => h.trim());
          
          hospitals = lines.slice(1).filter(line => line.trim()).map((line, index) => {
            const values = line.split(',').map(v => v.trim());
            const hospital: any = { id: `imported-${Date.now()}-${index}` };
            
            headers.forEach((header, i) => {
              if (header === 'equipment' || header === 'specialties') {
                hospital[header] = values[i] ? values[i].split(';').map(s => s.trim()) : [];
              } else if (header === 'distance') {
                hospital[header] = parseFloat(values[i]) || 0;
              } else {
                hospital[header] = values[i] || '';
              }
            });
            
            return hospital as Hospital;
          });
        } else {
          throw new Error('Unsupported file format');
        }

        if (!Array.isArray(hospitals) || hospitals.length === 0) {
          throw new Error('No valid hospitals found in file');
        }

        onImport(hospitals);
        toast.success(`Successfully imported ${hospitals.length} hospital(s)`);
        onOpenChange(false);
      } catch (error) {
        toast.error('Failed to import file. Please check the format.');
        console.error(error);
      }
    };

    reader.readAsText(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Hospitals</DialogTitle>
          <DialogDescription>
            Import hospitals from CSV or JSON file. Drag and drop or click to browse.
          </DialogDescription>
        </DialogHeader>

        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            isDragging ? 'border-primary bg-primary/5' : 'border-border'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-semibold mb-2">Drop your file here</p>
          <p className="text-sm text-muted-foreground mb-4">
            Supports .json and .csv files
          </p>
          
          <Button asChild variant="outline">
            <label className="cursor-pointer">
              Browse Files
              <input
                type="file"
                accept=".json,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </Button>
        </div>

        <div className="space-y-2 text-xs text-muted-foreground">
          <p className="font-semibold">Format Requirements:</p>
          <p><strong>JSON:</strong> Array of hospital objects with id, name, address, contact, distance, equipment[], specialties[]</p>
          <p><strong>CSV:</strong> Headers: id,name,address,contact,distance,equipment,specialties (use semicolons to separate array items)</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
