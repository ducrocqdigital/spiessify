import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface InspectionStartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: (anlass: string) => void;
}

const COMMON_OCCASIONS = [
  'Parade',
  'Abnahme vor der Parade',
  'Fackelzug',
  'Schießwettkampf',
  'Jahreshauptversammlung',
  'Sonstiges'
];

export const InspectionStartModal = ({ open, onOpenChange, onStart }: InspectionStartModalProps) => {
  const [anlass, setAnlass] = useState('');
  const [customAnlass, setCustomAnlass] = useState('');

  const handleStart = () => {
    const finalAnlass = anlass === 'Sonstiges' ? customAnlass : anlass;
    if (finalAnlass.trim()) {
      onStart(finalAnlass.trim());
      onOpenChange(false);
      setAnlass('');
      setCustomAnlass('');
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setAnlass('');
    setCustomAnlass('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Musterung starten</DialogTitle>
          <DialogDescription>
            Wählen Sie den Anlass für die Musterung aus.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="anlass">Anlass</Label>
            <Select value={anlass} onValueChange={setAnlass}>
              <SelectTrigger>
                <SelectValue placeholder="Anlass auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {COMMON_OCCASIONS.map((occasion) => (
                  <SelectItem key={occasion} value={occasion}>
                    {occasion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {anlass === 'Sonstiges' && (
            <div>
              <Label htmlFor="customAnlass">Eigener Anlass</Label>
              <Input
                id="customAnlass"
                value={customAnlass}
                onChange={(e) => setCustomAnlass(e.target.value)}
                placeholder="Anlass eingeben..."
                autoFocus
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Abbrechen
          </Button>
          <Button 
            onClick={handleStart}
            disabled={!anlass || (anlass === 'Sonstiges' && !customAnlass.trim())}
            className="bg-gradient-to-r from-primary to-primary-glow"
          >
            Starten
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};