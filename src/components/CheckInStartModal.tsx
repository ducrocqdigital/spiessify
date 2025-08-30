import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface CheckInStartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: (referenceTime: string, occasion: string) => void;
}

export const CheckInStartModal = ({ open, onOpenChange, onStart }: CheckInStartModalProps) => {
  const [referenceTime, setReferenceTime] = useState(() => {
    // Default to current time
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  });
  const [occasion, setOccasion] = useState('');

  const handleStart = () => {
    onStart(referenceTime, occasion);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Check-in starten</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reference-time">Check-in-Zeit</Label>
            <Input
              id="reference-time"
              type="time"
              value={referenceTime}
              onChange={(e) => setReferenceTime(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="occasion">Anlass</Label>
            <Input
              id="occasion"
              type="text"
              placeholder="z.B. Biwak"
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Abbrechen
            </Button>
            <Button onClick={handleStart}>
              Starten
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};