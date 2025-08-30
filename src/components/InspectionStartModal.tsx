import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface InspectionStartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: (anlass: string) => void;
}

export const InspectionStartModal = ({ open, onOpenChange, onStart }: InspectionStartModalProps) => {
  const [anlass, setAnlass] = useState('');

  const handleStart = () => {
    if (anlass.trim()) {
      onStart(anlass.trim());
      onOpenChange(false);
      setAnlass('');
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setAnlass('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Musterung starten</DialogTitle>
          <DialogDescription>
            Geben Sie den Anlass für die Musterung ein.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="anlass">Anlass</Label>
            <Input
              id="anlass"
              value={anlass}
              onChange={(e) => setAnlass(e.target.value)}
              placeholder="z.B. Parade, Abnahme vor der Parade, Fackelzug..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleStart();
                }
              }}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Abbrechen
          </Button>
          <Button 
            onClick={handleStart}
            disabled={!anlass.trim()}
            className="bg-gradient-to-r from-primary to-primary-glow"
          >
            Starten
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};