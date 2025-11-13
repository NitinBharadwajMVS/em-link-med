import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MultipleSymptomDropdown } from './MultipleSymptomDropdown';
import { Hospital } from '@/types/patient';
import { toast } from 'sonner';
import { z } from 'zod';

interface AddHospitalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (hospital: Hospital) => void;
}

const availableEquipment = [
  'Ventilator', 'ICU', 'CT Scan', 'MRI', 'X-Ray', 'Oxygen', 
  'Defibrillator', 'Cardiac Monitor', 'Cath Lab', 'Dialysis'
];

const hospitalSchema = z.object({
  name: z.string().trim().min(1, 'Hospital name is required').max(200, 'Hospital name must be less than 200 characters'),
  address: z.string().trim().min(1, 'Address is required').max(500, 'Address must be less than 500 characters'),
  contact: z.string().trim().regex(/^\+?[0-9\-\s()]{10,20}$/, 'Invalid contact number format'),
  distance: z.number().min(0, 'Distance must be positive').max(1000, 'Distance must be less than 1000 km').optional(),
  latitude: z.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90'),
  longitude: z.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180'),
  equipment: z.array(z.string()).max(20, 'Maximum 20 equipment items allowed')
});

export const AddHospitalDialog = ({ open, onOpenChange, onAdd }: AddHospitalDialogProps) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contact: '',
    distance: '',
    latitude: '',
    longitude: '',
    equipment: [] as string[],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsedData = {
      name: formData.name,
      address: formData.address,
      contact: formData.contact,
      distance: formData.distance ? parseFloat(formData.distance) : undefined,
      latitude: parseFloat(formData.latitude) || 12.9716,
      longitude: parseFloat(formData.longitude) || 77.5946,
      equipment: formData.equipment
    };

    const validation = hospitalSchema.safeParse(parsedData);
    
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    const newHospital: Hospital = {
      id: `custom-${Date.now()}`,
      name: validation.data.name,
      address: validation.data.address,
      contact: validation.data.contact,
      distance: validation.data.distance || 0,
      latitude: validation.data.latitude,
      longitude: validation.data.longitude,
      equipment: validation.data.equipment,
      specialties: [],
    };

    onAdd(newHospital);
    toast.success(`${validation.data.name} added successfully`);
    
    // Reset form
    setFormData({
      name: '',
      address: '',
      contact: '',
      distance: '',
      latitude: '',
      longitude: '',
      equipment: [],
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Hospital</DialogTitle>
          <DialogDescription>
            Add a new hospital to the database for this demo session.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Hospital Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., City Medical Center"
              required
            />
          </div>

          <div>
            <Label htmlFor="address">Address / Locality *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g., Koramangala, Bangalore"
              required
            />
          </div>

          <div>
            <Label htmlFor="contact">Contact Number *</Label>
            <Input
              id="contact"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              placeholder="e.g., +91-80-1234-5678"
              required
            />
          </div>

          <div>
            <Label htmlFor="distance">Distance (km) - Optional</Label>
            <Input
              id="distance"
              type="number"
              step="0.1"
              value={formData.distance}
              onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
              placeholder="e.g., 5.2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="0.0001"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                placeholder="e.g., 12.9716"
              />
            </div>
            <div>
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="0.0001"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                placeholder="e.g., 77.5946"
              />
            </div>
          </div>

          <div>
            <Label>Available Equipment</Label>
            <MultipleSymptomDropdown
              options={availableEquipment}
              values={formData.equipment}
              onChange={(equipment) => setFormData({ ...formData, equipment })}
              placeholder="Select available equipment..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Add Hospital
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
